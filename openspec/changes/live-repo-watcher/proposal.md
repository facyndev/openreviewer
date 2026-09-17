# Proposal: Real-Time Repository Watcher (Live Diff UI)

## Why

Currently, OpenReviewer fetches the repository diff and HEAD information once at startup. If the working tree changes (files modified/added/deleted by an editor, an external Git command, or an autonomous AI agent), the user must restart the application to observe updated diffs. To provide a seamless code review experience, OpenReviewer requires an automated, debounced repository watcher that updates the UI in real time while preserving the reviewer's navigation position.

## What Changes

### In Scope

- **Watcher Contract (`src/git/types.ts`)**:
  - `RepoWatcher` interface with `start(onChange)` and `stop()`.
  - `WatcherOptions` for debounce duration and ignore predicates.
- **Watcher Implementation (`src/git/watcher.ts`)**:
  - `FsRepoWatcher` using `node:fs.watch`.
  - Monitors working tree and Git state (`.git/index`, `.git/HEAD`).
  - Strict exclusion of high-noise directories (`node_modules`, `.git/objects`, `dist`, `.atl`, `coverage`).
  - Trailing debounce (default 250ms) to consolidate file save bursts.
- **UI State & Cursor Preservation (`src/ui/app.tsx`)**:
  - Reducer action `reload_diff` receiving updated `files`, `branch`, and `commitHash`.
  - Maintains the selected file by matching `newPath` across refreshes instead of resetting to index 0.
  - Gracefully clamps scroll offsets (`treeOffset`, `diffOffset`).
  - React effect subscribing to `RepoWatcher` on mount and cleaning up on unmount.
- **Keymap & Manual Trigger (`src/ui/keymap.ts`)**:
  - Support manual refresh via keypress (e.g. `R` or `Ctrl+R`).

### Out of Scope

- Bi-directional file editing (OpenReviewer remains strictly read-only).
- Watching remote repositories via network polling.

## Capabilities

### New Capabilities

- `live-watcher`: Real-time filesystem and Git state observer with debounced callback dispatch.

### Modified Capabilities

- `terminal-diff-explorer`: Shell dynamically responds to `reload_diff` events while preserving cursor and scroll boundaries.

## Success Criteria

- [x] `RepoWatcher` fires a debounced callback when working tree files or git indices change.
- [x] Rapid bursts of filesystem events within the debounce window produce exactly one reload.
- [x] UI preserves selected file by path and clamps scroll offsets when diff shrinks.
- [x] All tests pass (`npm test`).
- [x] Type check and linter clean (`npm run typecheck`, `npm run lint`).
- [x] RDD review validation succeeds.
