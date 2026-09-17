import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createGitService } from './service.js'
import { git, makeRepo, tmpDirs } from './test-helpers.js'
import type { GitService } from './types.js'

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Windows may hold handles briefly
    }
  }
})

describe('DefaultGitService (Clean Architecture Git Port)', () => {
  it('resolves root directory for a repository', async () => {
    const dir = makeRepo({ 'a.txt': 'initial' })
    const service = createGitService(dir)
    await expect(service.resolveRoot()).resolves.toBe(dir)
  })

  it('provides active branch and head info', async () => {
    const dir = makeRepo({ 'a.txt': 'hello' })
    const service = createGitService(dir)

    const branch = await service.getCurrentBranch()
    expect(branch).toBeTruthy()

    const head = await service.getHeadInfo()
    expect(head.branch).toBe(branch)
    expect(head.commitHash).toMatch(/^[0-9a-f]{7,}$/)
  })

  it('lists branches including active indicators and hashes', async () => {
    const dir = makeRepo({ 'a.txt': 'v1' })
    git(dir, ['branch', 'feat/test'])
    const service = createGitService(dir)

    const branches = await service.listBranches()
    expect(branches.length).toBeGreaterThanOrEqual(2)

    const current = branches.find((b) => b.current)
    expect(current).toBeDefined()
    expect(current?.commitHash).toMatch(/^[0-9a-f]{7,}$/)

    const feat = branches.find((b) => b.name === 'feat/test')
    expect(feat).toBeDefined()
    expect(feat?.current).toBe(false)
  })

  it('fetches diffs through the service interface', async () => {
    const dir = makeRepo({ 'a.txt': 'original\n' })
    git(dir, ['commit', '-am', 'second', '--allow-empty'])
    const service = createGitService(dir)

    const diff = await service.getDiff()
    expect(diff).toBeDefined()
    expect(Array.isArray(diff.files)).toBe(true)
  })

  it('fetches commit history (log) with parsed metadata', async () => {
    const dir = makeRepo({ 'a.txt': 'one' })
    git(dir, ['commit', '-am', 'feat: second commit', '--allow-empty'])
    const service = createGitService(dir)

    const commits = await service.getCommits()
    expect(commits.length).toBeGreaterThanOrEqual(2)
    expect(commits[0]?.subject).toContain('second commit')
    expect(commits[0]?.shortHash).toMatch(/^[0-9a-f]{7,}$/)
    expect(commits[0]?.author).toBe('Test Runner')
    expect(commits[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('retrieves file content at a specific ref (show)', async () => {
    const dir = makeRepo({ 'hello.txt': 'world\n' })
    const service = createGitService(dir)

    const content = await service.getFileContent('HEAD', 'hello.txt')
    expect(content).toBe('world\n')
  })

  it('rejects outside of any repository', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'openreviewer-norepo-'))
    tmpDirs.push(dir)
    const service = createGitService(dir)
    await expect(service.resolveRoot()).rejects.toMatchObject({ code: 'NOT_A_REPO' })
  })

  it('allows mock implementation for isolated dependency injection', async () => {
    const mockService: GitService = {
      resolveRoot: async () => '/mock/repo',
      getCurrentBranch: async () => 'mock-branch',
      getHeadInfo: async () => ({ branch: 'mock-branch', commitHash: '1234567' }),
      listBranches: async () => [{ name: 'mock-branch', current: true, commitHash: '1234567' }],
      getDiff: async () => ({ files: [] }),
      getCommits: async () => [
        {
          hash: '1234567890abcdef',
          shortHash: '1234567',
          author: 'Alice',
          date: '2026-09-17',
          subject: 'mock commit',
        },
      ],
      getFileContent: async () => 'mock file content',
    }

    const head = await mockService.getHeadInfo()
    expect(head.branch).toBe('mock-branch')
    const commits = await mockService.getCommits()
    expect(commits[0]?.author).toBe('Alice')
  })
})
