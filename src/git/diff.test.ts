import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fetchDiff } from './diff.js'
import { git, makeRepo, tmpDirs } from './test-helpers.js'
import type { DiffResult, FileDiff } from './types.js'

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
})