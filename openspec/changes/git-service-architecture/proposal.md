# Proposal: Git Service Architecture (Clean Architecture Port)

## Why

OpenReviewer previously executed Git operations through ad-hoc functions scattered across `diff.ts` and `repo.ts`, directly coupling higher layers to filesystem paths and OS child process execution. To support comprehensive review features (e.g. branch management, commit history/log, and revision inspection) while maintaining testability, the system requires a formal Clean Architecture port (`GitService`) that decouples business and UI layers from the underlying Git binary.

## What Changes

### In Scope

- **Domain Contracts (`src/git/types.ts`)**: Define `GitService` port interface, `BranchInfo`, `CommitSummary`, and `DiffRange`.
- **Default Git Service (`src/git/service.ts`)**: Implement `DefaultGitService` providing:
  - `getCurrentBranch()`, `listBranches()`, `getHeadInfo()`
  - `getDiff()`
  - `getCommits()` (commit history & metadata)
  - `getFileContent()` (full file inspection at ref)
- **Dependency Inversion**:
  - Refactor CLI entry (`src/cli/main.ts`) to accept and inject `GitService`.
  - Refactor TUI shell (`src/ui/app.tsx`) to accept optional `GitService`.
- **Testing**:
  - Integration and unit tests in `src/git/service.test.ts` covering all capabilities on real repositories as well as in-memory mocks.
- **Documentation**:
  - Update `AGENTS.md` key design principles to mandate Clean Architecture and reflect `src/git/service.ts`.
  - Remove completed "Phase 1" roadmap section.

### Out of Scope

- Writing/mutating Git operations (OpenReviewer is strictly read-only).
- Remote Git hosting providers (GitHub/GitLab PR APIs belong to future phase).

## Capabilities

### New Capabilities

- `git-service`: Unified port & adapter interface providing branch querying, diff retrieval, commit log metadata, and file content at revisions.

### Modified Capabilities

- `cli-entry`: Injects `GitService` instance instead of importing low-level diff/repo runners directly.
- `terminal-diff-explorer`: Shell accepts `gitService` for decoupled execution.

## Success Criteria

- [x] All existing and new tests pass (`npm test`).
- [x] Type checking passes without errors (`npm run typecheck`).
- [x] Linting passes without errors (`npm run lint`).
- [x] Build compiles cleanly (`npm run build`).
- [x] `AGENTS.md` reflects Clean Architecture and removes completed Phase 1.
