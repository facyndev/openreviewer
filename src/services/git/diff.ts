/** Diff fetching: shell git as the single source of truth (REQ-3, REQ-6). */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { parseDiff } from './parser.js'
import { resolveRoot, runGit } from './repo.js'
import type { DiffRange, DiffResult, FileDiff } from './types.js'
export type { DiffRange } from './types.js'

export async function fetchDiff(range?: DiffRange, cwd: string = process.cwd()): Promise<DiffResult> {
  const root = await resolveRoot(cwd)

  if (range) {
    const args = ['diff', '--no-color', '--no-ext-diff', range.from, range.to]
    const raw = await runGit(args, root)
    return parseDiff(raw)
  }

  // Combine staged + unstaged tracked changes with untracked file discovery.
  const [diffRaw, statusRaw] = await Promise.all([
    runGit(['diff', '--no-color', '--no-ext-diff', 'HEAD'], root).catch(() => ''),
    runGit(['status', '--porcelain', '-uall'], root).catch(() => ''),
  ])

  const result = parseDiff(diffRaw)

  // Discover untracked files that git diff HEAD cannot see.
  const knownPaths = new Set(result.files.map((f) => f.newPath || f.oldPath))
  const untrackedPaths = parseUntrackedPaths(statusRaw).filter((p) => !knownPaths.has(p))

  // Synthesize diffs for untracked files (show full content as added).
  const untrackedDiffs = await Promise.all(
    untrackedPaths.map((p) => synthesizeAddedDiff(root, p)),
  )

  return { files: [...result.files, ...untrackedDiffs] }
}

/** Extracts untracked file paths (`??`) from `git status --porcelain` output. */
function parseUntrackedPaths(porcelain: string): string[] {
  const paths: string[] = []
  for (const line of porcelain.split('\n')) {
    if (line.startsWith('?? ')) {
      // Remove trailing slash for directories (shouldn't happen with -uall for files).
      paths.push(line.slice(3).replace(/\/$/, ''))
    }
  }
  return paths
}

/** Builds a synthetic FileDiff for an untracked file, showing all lines as added. */
async function synthesizeAddedDiff(root: string, filePath: string): Promise<FileDiff> {
  let content: string
  try {
    content = await readFile(join(root, filePath), 'utf8')
  } catch {
    // Binary or unreadable — show as binary.
    return {
      status: 'binary',
      oldPath: '',
      newPath: filePath,
      hunks: [],
    }
  }

  const lines = content.split('\n')
  // Remove trailing empty element from a file ending with newline.
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

  return {
    status: 'added',
    oldPath: '',
    newPath: filePath,
    hunks: lines.length > 0
      ? [
          {
            header: `@@ -0,0 +1,${lines.length} @@`,
            oldStart: 0,
            oldLines: 0,
            newStart: 1,
            newLines: lines.length,
            lines: lines.map((text, i) => ({
              kind: 'added' as const,
              text: `+${text}`,
              newNo: i + 1,
            })),
          },
        ]
      : [],
  }
}