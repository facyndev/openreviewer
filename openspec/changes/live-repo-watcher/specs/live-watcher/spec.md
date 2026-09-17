# Specification: Live Repository Watcher

## Requirements

### REQ-LW-1: Watcher Interface
The system MUST define a `RepoWatcher` interface in `src/git/types.ts`:
```ts
export interface WatcherOptions {
  debounceMs?: number
  ignored?: (path: string) => boolean
}

export interface RepoWatcher {
  start(onChange: () => void | Promise<void>): void
  stop(): void
}
```

### REQ-LW-2: Debouncing & Coalescing
The watcher MUST debounce filesystem events with a configurable trailing timer (default 250ms), guaranteeing that a burst of file modifications emits exactly one `onChange` invocation after the burst settles.

### REQ-LW-3: Noise Filtering
The watcher MUST ignore file events from:
- `node_modules/`
- `.git/objects/`
- `.git/logs/`
- `dist/`
- `.atl/`
- `coverage/`
- `.codegraph/`

### REQ-LW-4: Git State Sensitivity
The watcher MUST observe changes to `.git/index` (staging) and `.git/HEAD` or `.git/refs` (commits, branch changes) in addition to working tree source files.

### REQ-LW-5: Clean Lifecycle
Calling `stop()` on a running `RepoWatcher` MUST close all active OS watchers and clear any pending timers, preventing memory leaks and lingering process handles.

### REQ-LW-6: UI Cursor & Scroll Preservation
When the UI reducer handles a `reload_diff` action:
- If the previously selected file still exists (matching `newPath`), it MUST remain selected regardless of its new array index.
- If the previously selected file was deleted, the selection MUST clamp to the nearest valid index (`0 <= index < files.length`).
- The vertical scroll offset `diffOffset` MUST clamp to the total rows of the newly rendered diff.
