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

export interface ReviewComment {
  id: string
  filePath: string
  line?: number
  author: string
  timeAgo: string
  status: 'pending' | 'resolved'
  text: string
}

export interface HeadInfo {
  branch: string
  commitHash: string
}

export interface BranchInfo {
  name: string
  current: boolean
  commitHash: string
}

export interface CommitSummary {
  hash: string
  shortHash: string
  subject: string
  author: string
  date: string
}

export interface DiffRange {
  from: string
  to: string
}

export interface WatcherOptions {
  debounceMs?: number
  ignored?: (path: string) => boolean
}

export interface RepoWatcher {
  start(onChange: () => void | Promise<void>): void
  stop(): void
}

export interface GitService {
  resolveRoot(cwd?: string): Promise<string>
  getCurrentBranch(cwd?: string): Promise<string>
  getHeadInfo(cwd?: string): Promise<HeadInfo>
  listBranches(cwd?: string): Promise<BranchInfo[]>
  getDiff(range?: DiffRange, cwd?: string): Promise<DiffResult>
  getCommits(range?: DiffRange, limit?: number, cwd?: string): Promise<CommitSummary[]>
  getFileContent(ref: string, path: string, cwd?: string): Promise<string>
  watch(
    onChange: () => void | Promise<void>,
    options?: WatcherOptions,
    cwd?: string,
  ): Promise<RepoWatcher>
}

export type GitErrorCode = 'NOT_A_REPO' | 'GIT_FAILED'
export class GitError extends Error {
  constructor(readonly code: GitErrorCode, message: string) {
    super(message)
    this.name = 'GitError'
  }
}