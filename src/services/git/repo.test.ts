import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getHeadInfo, resolveRoot } from './repo.js'
import { git, makeRepo, tmpDirs } from './test-helpers.js'

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Windows may hold handles briefly
    }
  }
})

describe('repo resolution (threat matrix: repo selection)', () => {
  it('resolves the root of a real repository', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    await expect(resolveRoot(dir)).resolves.toBe(dir)
  })

  it('rejects clearly outside any repository with a typed error', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'openreviewer-norepo-'))
    tmpDirs.push(dir)
    await expect(resolveRoot(dir)).rejects.toMatchObject({ code: 'NOT_A_REPO' })
  })
})

describe('getHeadInfo', () => {
  it('returns current branch and short commit hash in a valid repository', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    const info = await getHeadInfo(dir)
    expect(info.branch).toBeTruthy()
    expect(info.commitHash).toMatch(/^[0-9a-f]{7,}$/)
  })

  it('handles detached HEAD state', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    git(dir, ['checkout', '--detach'])
    const info = await getHeadInfo(dir)
    expect(info.branch).toBe('HEAD')
    expect(info.commitHash).toMatch(/^[0-9a-f]{7,}$/)
  })

  it('rejects outside of a git repository', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'openreviewer-norepo-'))
    tmpDirs.push(dir)
    await expect(getHeadInfo(dir)).rejects.toMatchObject({ code: 'NOT_A_REPO' })
  })
})