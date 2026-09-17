/** Real-time repository watcher: debounced filesystem and git state observer. */

import { watch, type FSWatcher } from 'node:fs'
import { resolveRoot } from './repo.js'
import type { RepoWatcher, WatcherOptions } from './types.js'

const DEFAULT_IGNORED_PATTERNS = [
  'node_modules',
  '.git/objects',
  '.git/logs',
  'dist',
  '.atl',
  'coverage',
  '.codegraph',
  '.pi',
]

export function isDefaultIgnored(filename: string): boolean {
  const normalized = filename.replace(/\\/g, '/')
  for (const pattern of DEFAULT_IGNORED_PATTERNS) {
    if (
      normalized === pattern ||
      normalized.startsWith(`${pattern}/`) ||
      normalized.includes(`/${pattern}/`) ||
      normalized.endsWith(`/${pattern}`)
    ) {
      return true
    }
  }
  return false
}

export class FsRepoWatcher implements RepoWatcher {
  private watcher: FSWatcher | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private running = false

  constructor(
    private readonly root: string,
    private readonly options: WatcherOptions = {},
  ) {}

  start(onChange: () => void | Promise<void>): void {
    if (this.running) return
    this.running = true

    const debounceMs = this.options.debounceMs ?? 250
    const ignored = this.options.ignored ?? isDefaultIgnored

    const handleEvent = (_eventType: string, filename: string | null) => {
      if (!this.running) return
      if (filename && ignored(filename)) {
        return
      }

      if (this.timer !== null) {
        clearTimeout(this.timer)
      }

      this.timer = setTimeout(() => {
        this.timer = null
        if (this.running) {
          void onChange()
        }
      }, debounceMs)
    }

    try {
      this.watcher = watch(this.root, { recursive: true }, handleEvent)
      this.watcher.on('error', () => {
        // Handle watcher error gracefully without crashing process
      })
    } catch {
      // Fallback if recursive watching is unsupported in current environment
      try {
        this.watcher = watch(this.root, handleEvent)
      } catch {
        this.watcher = null
      }
    }
  }

  stop(): void {
    this.running = false
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.watcher !== null) {
      this.watcher.close()
      this.watcher = null
    }
  }
}

export async function createRepoWatcher(
  cwd: string = process.cwd(),
  options?: WatcherOptions,
): Promise<RepoWatcher> {
  const root = await resolveRoot(cwd)
  return new FsRepoWatcher(root, options)
}
