import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fetchDiff } from './diff.js'
import { resolveRoot } from './repo.js'
import type { DiffResult, FileDiff } from './types.js'

const tmpDirs: string[] = []

function makeRepo(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'openreviewer-test-'))
  tmpDirs.push(dir)
  git(dir, ['init', '-q'])
  git(dir, ['config', 'user.email', 'test@example.com'])
  git(dir, ['config', 'user.name', 'Test Runner'])
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content)
  }
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'initial'])
  return dir
}

function git(dir: string, args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function modified(diff: DiffResult): FileDiff[] {
  return diff.files.filter((f) => f.hunks.length > 0)
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Windows may hold handles briefly
    }
  }
})

describe('repo resolution', () => {
  it('resolves the root of a real repository', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    await expect(resolveRoot(dir)).resolves.toBe(dir)
  })

  it('rejects clearly outside any repository', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'openreviewer-norepo-'))
    tmpDirs.push(dir)
    await expect(resolveRoot(dir)).rejects.toMatchObject({ code: 'NOT_A_REPO' })
  })
})

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