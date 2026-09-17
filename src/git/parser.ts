/** Unified-diff parsing and mapping to domain types (REQ-5). */

import parseGitDiff from 'parse-diff'
import type { Change, Chunk, File } from 'parse-diff'
import type { DiffResult, FileDiff, FileStatus, Hunk, Line, LineKind } from './types.js'

export function parseDiff(raw: string): DiffResult {
  const trimmed = raw.trim()
  if (trimmed === '') return { files: [] }
  const sections = splitSections(trimmed)
  const files = parseGitDiff(trimmed)
  return {
    files: sections.map((section, i) => mapFile(section, files[i] ?? { chunks: [], deletions: 0, additions: 0 })),
  }
}

/** Splits a unified diff into per-file sections on `diff --git` boundaries. */
function splitSections(raw: string): string[] {
  const lines = raw.split('\n')
  const sections: string[] = []
  let current: string[] = []
  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      if (current.length > 0) sections.push(current.join('\n'))
      current = [line]
    } else if (current.length > 0) {
      current.push(line)
    }
  }
  if (current.length > 0) sections.push(current.join('\n'))
  return sections
}

function mapFile(section: string, file: File): FileDiff {
  const hunks: Hunk[] = file.chunks.map(mapChunk)
  return {
    status: statusOf(section, file),
    oldPath: file.from ?? '',
    newPath: file.to ?? '',
    hunks,
  }
}

function statusOf(section: string, file: File): FileStatus {
  if (/^Binary files .* differ$/m.test(section) || /^GIT binary patch$/m.test(section)) return 'binary'
  if (file.new || file.from === '/dev/null') return 'added'
  if (file.deleted || file.to === '/dev/null') return 'deleted'
  if (/^(similarity index|rename (from|to)) /m.test(section)) return 'renamed'
  if (file.chunks.length > 0) return 'modified'
  return 'unknown'
}

function mapChunk(chunk: Chunk): Hunk {
  return {
    header: chunk.content,
    oldStart: chunk.oldStart,
    oldLines: chunk.oldLines,
    newStart: chunk.newStart,
    newLines: chunk.newLines,
    lines: chunk.changes.map(mapLine),
  }
}

function mapLine(change: Change): Line {
  if (change.type === 'add') {
    return { kind: 'added', text: change.content, newNo: change.ln }
  }
  if (change.type === 'del') {
    return { kind: 'removed', text: change.content, oldNo: change.ln }
  }
  if (change.type === 'normal') {
    return { kind: 'context', text: change.content, oldNo: change.ln1, newNo: change.ln2 }
  }
  // parse-diff also emits `\ No newline at end of file` entries at runtime that
  // its shipped types do not model; mirror them as context lines.
  const unknown = change as unknown as { content?: string; ln1?: number; ln2?: number }
  return { kind: 'context', text: unknown.content ?? '', oldNo: unknown.ln1, newNo: unknown.ln2 }
}

export type { FileStatus, Hunk, Line, LineKind }