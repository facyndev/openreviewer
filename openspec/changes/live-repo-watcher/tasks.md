# Tasks: live-repo-watcher

## Phase 1: Domain Types & Watcher Contract
- [x] 1.1 Add `WatcherOptions` and `RepoWatcher` interfaces to `src/git/types.ts`.
- [x] 1.2 Export `createRepoWatcher` factory from `src/git/watcher.ts`.

## Phase 2: Watcher Implementation & Strict TDD
- [x] 2.1 Implement `FsRepoWatcher` in `src/git/watcher.ts` using `node:fs.watch`.
- [x] 2.2 Implement debouncing and ignore path matching.
- [x] 2.3 Implement `.git/index` and `.git/HEAD` observation.
- [x] 2.4 Create `src/git/watcher.test.ts` testing debouncing, noise filtering, and lifecycle.

## Phase 3: UI Reducer & App Integration
- [x] 3.1 Add `reload_diff` action to `Action` union in `src/ui/keymap.ts`.
- [x] 3.2 Update `reducer` in `src/ui/app.tsx` with intelligent selection preservation by `newPath` and offset clamping.
- [x] 3.3 Add `useEffect` hook in `App` to subscribe to `gitService` / `RepoWatcher`.
- [x] 3.4 Add unit tests for `reload_diff` in `src/ui/app.test.tsx`.

## Phase 4: Verification & RDD
- [x] 4.1 Run full test suite: `npm test`.
- [x] 4.2 Run type check: `npm run typecheck`.
- [x] 4.3 Run linter: `npm run lint`.
- [x] 4.4 Run build: `npm run build`.
- [ ] 4.5 Execute RDD review validation.
