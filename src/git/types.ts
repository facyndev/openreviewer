/** Domain types for the git diff pipeline (REQ-4, REQ-5). */

export type LineKind = 'added' | 'removed' | 'context'

export interface Line {
  kind: LineKind
  text: string
  /** old-side line number; set for removed and context lines */
  oldNo?: number
  /** new-side line number; set for added and context lines */
  newNo?: number
}

export interface Hunk {
  header: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: Line[]
}

export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'binary' | 'unknown'

export interface FileDiff {
  status: FileStatus
  oldPath: string
  newPath: string
  hunks: Hunk[]
}

export type DiffResult = { files: FileDiff[] }

export type GitErrorCode = 'NOT_A_REPO' | 'GIT_FAILED'
export class GitError extends Error {
  constructor(readonly code: GitErrorCode, message: string) {
    super(message)
    this.name = 'GitError'
  }
}