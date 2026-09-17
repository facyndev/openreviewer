import { rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fetchDiff } from './diff.js'
import { git, makeRepo, tmpDirs } from './test-helpers.js'
import type { DiffResult, FileDiff, FileStatus } from './types.js'

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Windows may hold handles briefly
    }
  }
})

function modified(diff: DiffResult): FileDiff[] {
  return diff.files.filter((f) => f.hunks.length > 0)
}

function filesByStatus(diff: DiffResult, status: FileStatus): FileDiff[] {
  return diff.files.filter((f) => f.status === status)
}

describe('fetchDiff integration', () => {
  it('shows working-tree changes by default against HEAD', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    writeFileSync(join(dir, 'a.txt'), 'two\n')
    writeFileSync(join(dir, 'b.txt'), 'new file\n')
    git(dir, ['add', '.'])
    const diff = await fetchDiff(undefined, dir)
    const files = diff.files.filter((f) => f.hunks.length > 0 || f.status === 'added')
    expect(files.map((f) => f.newPath).sort()).toEqual(['a.txt', 'b.txt'])
  })

  it('returns an empty diff for identical refs', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    const diff = await fetchDiff({ from: 'HEAD', to: 'HEAD' }, dir)
    expect(diff.files).toEqual([])
  })

  it('fetches a range between two commits', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    writeFileSync(join(dir, 'a.txt'), 'two\n')
    git(dir, ['add', '.'])
    git(dir, ['commit', '-q', '-m', 'second'])
    const diff = await fetchDiff({ from: 'HEAD~1', to: 'HEAD' }, dir)
    expect(modified(diff)).toHaveLength(1)
    expect(modified(diff)[0].newPath).toBe('a.txt')
  })

  it('shows staged added files with status added', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    writeFileSync(join(dir, 'new.txt'), 'brand new\n')
    git(dir, ['add', 'new.txt'])
    const diff = await fetchDiff(undefined, dir)
    const added = filesByStatus(diff, 'added')
    expect(added).toHaveLength(1)
    expect(added[0].newPath).toBe('new.txt')
    expect(added[0].hunks.length).toBeGreaterThan(0)
  })

  it('shows staged deleted files with status deleted', async () => {
    const dir = makeRepo({ 'a.txt': 'one', 'b.txt': 'two' })
    unlinkSync(join(dir, 'b.txt'))
    git(dir, ['add', 'b.txt'])
    const diff = await fetchDiff(undefined, dir)
    const deleted = filesByStatus(diff, 'deleted')
    expect(deleted).toHaveLength(1)
    expect(deleted[0].oldPath).toBe('b.txt')
    expect(deleted[0].hunks.length).toBeGreaterThan(0)
  })

  it('shows staged modified files with status modified', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    writeFileSync(join(dir, 'a.txt'), 'updated\n')
    git(dir, ['add', 'a.txt'])
    const diff = await fetchDiff(undefined, dir)
    const mods = filesByStatus(diff, 'modified')
    expect(mods).toHaveLength(1)
    expect(mods[0].newPath).toBe('a.txt')
  })

  it('discovers untracked files and synthesizes added diffs', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    writeFileSync(join(dir, 'untracked.txt'), 'hello world\n')
    const diff = await fetchDiff(undefined, dir)
    const added = filesByStatus(diff, 'added')
    expect(added.map((f) => f.newPath)).toContain('untracked.txt')
    const untracked = added.find((f) => f.newPath === 'untracked.txt')!
    expect(untracked.hunks).toHaveLength(1)
    expect(untracked.hunks[0].lines).toHaveLength(1)
    expect(untracked.hunks[0].lines[0].kind).toBe('added')
  })

  it('combines all states: added, modified, deleted, and untracked', async () => {
    const dir = makeRepo({ 'existing.txt': 'hello', 'willdelete.txt': 'bye' })
    // Stage a modification
    writeFileSync(join(dir, 'existing.txt'), 'hello modified\n')
    git(dir, ['add', 'existing.txt'])
    // Stage a deletion
    unlinkSync(join(dir, 'willdelete.txt'))
    git(dir, ['add', 'willdelete.txt'])
    // Stage a new file
    writeFileSync(join(dir, 'staged-new.txt'), 'new staged\n')
    git(dir, ['add', 'staged-new.txt'])
    // Create an untracked file
    writeFileSync(join(dir, 'untracked.txt'), 'untracked content\n')

    const diff = await fetchDiff(undefined, dir)

    const statuses = new Map(diff.files.map((f) => [f.newPath || f.oldPath, f.status]))
    expect(statuses.get('existing.txt')).toBe('modified')
    expect(statuses.get('willdelete.txt')).toBe('deleted')
    expect(statuses.get('staged-new.txt')).toBe('added')
    expect(statuses.get('untracked.txt')).toBe('added')
  })

  it('does not duplicate untracked files already covered by git diff HEAD', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    writeFileSync(join(dir, 'new.txt'), 'brand new\n')
    git(dir, ['add', 'new.txt'])
    // new.txt is staged, so git diff HEAD already shows it.
    // git status shows it as 'A ' not '??' — it should NOT be duplicated.
    const diff = await fetchDiff(undefined, dir)
    const newFiles = diff.files.filter((f) => f.newPath === 'new.txt')
    expect(newFiles).toHaveLength(1)
  })
})