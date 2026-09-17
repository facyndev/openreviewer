/** Shared helpers for git integration tests (real spawned git in temp repos). */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const tmpDirs: string[] = []

export function makeRepo(files: Record<string, string>): string {
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

export function git(dir: string, args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}