# Tasks: git-service-architecture

## Phase 1: Contracts & Domain Types
- [x] 1.1 Define `BranchInfo`, `CommitSummary`, `DiffRange`, and `GitService` port interface in `src/git/types.ts`.
- [x] 1.2 Re-export `DiffRange` in `src/git/diff.ts` for backward compatibility.

## Phase 2: Service Implementation & Unit Tests
- [x] 2.1 Implement `DefaultGitService` and `createGitService()` in `src/git/service.ts`.
- [x] 2.2 Implement `getCurrentBranch()`, `getHeadInfo()`, and `listBranches()`.
- [x] 2.3 Implement `getDiff()` wrapping `fetchDiff()`.
- [x] 2.4 Implement `getCommits()` parsing git log format `%H|%h|%an|%ad|%s`.
- [x] 2.5 Implement `getFileContent()` using `git show <ref>:<path>`.
- [x] 2.6 Create comprehensive tests in `src/git/service.test.ts` covering real Git repos and in-memory mocks.

## Phase 3: Composition Root & UI Wiring
- [x] 3.1 Refactor `src/cli/main.ts` to accept and inject `GitService`.
- [x] 3.2 Update `src/ui/app.tsx` to accept optional `gitService` prop.
- [x] 3.3 Update `AGENTS.md` key design principles with Clean Architecture and remove Phase 1 roadmap.

## Phase 4: Verification & Quality Gates
- [x] 4.1 Run test suite: `npm test` green (94/94 tests).
- [x] 4.2 Run type check: `npm run typecheck` clean.
- [x] 4.3 Run linter: `npm run lint` clean.
- [x] 4.4 Run build: `npm run build` clean.
