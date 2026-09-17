/** Diff fetching: shell git as the single source of truth (REQ-3, REQ-6). */

import { parseDiff } from './parser.js'
import { resolveRoot, runGit } from './repo.js'
import type { DiffResult } from './types.js'

export interface DiffRange {
  from: string
  to: string
}

export async function fetchDiff(range?: DiffRange, cwd: string = process.cwd()): Promise<DiffResult> {
  const root = await resolveRoot(cwd)
  const args = ['diff', '--no-color', '--no-ext-diff']
  if (range) {
    args.push(range.from, range.to)
  } else {
    args.push('HEAD')
  }
  const raw = await runGit(args, root)
  return parseDiff(raw)
}