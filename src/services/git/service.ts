/** Git Service implementation: ports and adapters architecture for Git operations. */

import { fetchDiff } from './diff.js'
import { getHeadInfo, resolveRoot, runGit } from './repo.js'
import type {
  BranchInfo,
  CommitSummary,
  DiffRange,
  DiffResult,
  GitService,
  HeadInfo,
  RepoWatcher,
  WatcherOptions,
} from './types.js'
import { FsRepoWatcher } from './watcher.js'

export class DefaultGitService implements GitService {
  constructor(private readonly defaultCwd: string = process.cwd()) {}

  async resolveRoot(cwd?: string): Promise<string> {
    return resolveRoot(cwd ?? this.defaultCwd)
  }

  async getCurrentBranch(cwd?: string): Promise<string> {
    const root = await this.resolveRoot(cwd)
    let branch = ''
    try {
      const out = await runGit(['branch', '--show-current'], root)
      branch = out.trim()
    } catch {
      // ignore
    }

    if (!branch) {
      try {
        const out = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], root)
        branch = out.trim()
      } catch {
        branch = ''
      }
    }

    return branch
  }

  async getHeadInfo(cwd?: string): Promise<HeadInfo> {
    return getHeadInfo(cwd ?? this.defaultCwd)
  }

  async listBranches(cwd?: string): Promise<BranchInfo[]> {
    const root = await this.resolveRoot(cwd)
    let out = ''
    try {
      out = await runGit(
        ['branch', '--format=%(refname:short)|%(HEAD)|%(objectname:short)'],
        root,
      )
    } catch {
      return []
    }

    const lines = out.split('\n').map((l) => l.trim()).filter(Boolean)
    return lines.map((line) => {
      const [name = '', headMark = '', commitHash = ''] = line.split('|')
      return {
        name,
        current: headMark.trim() === '*',
        commitHash: commitHash.trim(),
      }
    })
  }

  async getDiff(range?: DiffRange, cwd?: string): Promise<DiffResult> {
    return fetchDiff(range, cwd ?? this.defaultCwd)
  }

  async getCommits(
    range?: DiffRange,
    limit: number = 50,
    cwd?: string,
  ): Promise<CommitSummary[]> {
    const root = await this.resolveRoot(cwd)
    const args = [
      'log',
      '--format=%H|%h|%an|%ad|%s',
      '--date=short',
      '-n',
      String(limit),
    ]
    if (range) {
      args.push(`${range.from}..${range.to}`)
    }

    let out = ''
    try {
      out = await runGit(args, root)
    } catch {
      return []
    }

    const lines = out.split('\n').map((l) => l.trim()).filter(Boolean)
    return lines.map((line) => {
      const [hash = '', shortHash = '', author = '', date = '', ...subjectParts] = line.split('|')
      return {
        hash,
        shortHash,
        author,
        date,
        subject: subjectParts.join('|'),
      }
    })
  }

  async getFileContent(ref: string, path: string, cwd?: string): Promise<string> {
    const root = await this.resolveRoot(cwd)
    return runGit(['show', `${ref}:${path}`], root)
  }

  async watch(
    onChange: () => void | Promise<void>,
    options?: WatcherOptions,
    cwd?: string,
  ): Promise<RepoWatcher> {
    const root = await this.resolveRoot(cwd)
    const watcher = new FsRepoWatcher(root, options)
    watcher.start(onChange)
    return watcher
  }
}

export function createGitService(defaultCwd?: string): GitService {
  return new DefaultGitService(defaultCwd)
}

export const gitService: GitService = createGitService()
