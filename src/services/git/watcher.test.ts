import { appendFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { makeRepo, tmpDirs } from './test-helpers.js'
import { createRepoWatcher, FsRepoWatcher, isDefaultIgnored } from './watcher.js'

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Windows file locks may linger momentarily
    }
  }
})

describe('isDefaultIgnored', () => {
  it('identifies noisy paths to ignore', () => {
    expect(isDefaultIgnored('node_modules/foo/index.js')).toBe(true)
    expect(isDefaultIgnored('.git/objects/ab/123456')).toBe(true)
    expect(isDefaultIgnored('.git/logs/HEAD')).toBe(true)
    expect(isDefaultIgnored('dist/cli/main.js')).toBe(true)
    expect(isDefaultIgnored('.atl/skill-registry.md')).toBe(true)
    expect(isDefaultIgnored('coverage/lcov.info')).toBe(true)
  })

  it('allows source files and critical git references', () => {
    expect(isDefaultIgnored('src/ui/app.tsx')).toBe(false)
    expect(isDefaultIgnored('README.md')).toBe(false)
    expect(isDefaultIgnored('.git/index')).toBe(false)
    expect(isDefaultIgnored('.git/HEAD')).toBe(false)
  })
})

describe('FsRepoWatcher', () => {
  it('debounces rapid changes into a single notification', async () => {
    const dir = makeRepo({ 'test.txt': 'initial' })
    let callCount = 0

    const watcher = new FsRepoWatcher(dir, { debounceMs: 50 })
    watcher.start(() => {
      callCount++
    })

    // Rapid writes
    appendFileSync(join(dir, 'test.txt'), '\nline2')
    appendFileSync(join(dir, 'test.txt'), '\nline3')
    appendFileSync(join(dir, 'test.txt'), '\nline4')

    // Wait past the debounce threshold
    await new Promise((resolve) => setTimeout(resolve, 150))

    watcher.stop()
    expect(callCount).toBe(1)
  })

  it('stops cleanly and ignores subsequent file events', async () => {
    const dir = makeRepo({ 'file.txt': 'hello' })
    let callCount = 0

    const watcher = new FsRepoWatcher(dir, { debounceMs: 50 })
    watcher.start(() => {
      callCount++
    })

    watcher.stop()

    appendFileSync(join(dir, 'file.txt'), ' more')
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(callCount).toBe(0)
  })

  it('creates watcher via factory from git repository root', async () => {
    const dir = makeRepo({ 'a.txt': '1' })
    const subDir = join(dir, 'nested')
    mkdirSync(subDir)

    const watcher = await createRepoWatcher(subDir)
    expect(watcher).toBeInstanceOf(FsRepoWatcher)
    watcher.stop()
  })

  it('ignores events in ignored directories', async () => {
    const dir = makeRepo({ 'main.ts': 'code' })
    const distDir = join(dir, 'dist')
    mkdirSync(distDir)

    let callCount = 0
    const watcher = new FsRepoWatcher(dir, { debounceMs: 50 })
    watcher.start(() => {
      callCount++
    })

    writeFileSync(join(distDir, 'bundle.js'), 'packed')
    await new Promise((resolve) => setTimeout(resolve, 120))

    watcher.stop()
    expect(callCount).toBe(0)
  })
})
