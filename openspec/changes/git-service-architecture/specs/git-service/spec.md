# Specification: Git Service Port & Adapters

## Requirements

### REQ-GS-1: Unified GitService Interface
The system MUST define a domain interface `GitService` in `src/git/types.ts` representing all read-only repository operations.

### REQ-GS-2: Branch Capabilities
`GitService` MUST provide:
- `getCurrentBranch(cwd?)`: Returns the active branch name, or empty/detached reference.
- `getHeadInfo(cwd?)`: Returns the active branch name and short commit hash.
- `listBranches(cwd?)`: Returns a list of `BranchInfo` with branch name, boolean `current` indicator, and commit hash.

### REQ-GS-3: Diff Capability
`GitService` MUST provide:
- `getDiff(range?, cwd?)`: Returns a `DiffResult` containing parsed `FileDiff[]`.

### REQ-GS-4: Commit History (Log) Capability
`GitService` MUST provide:
- `getCommits(range?, limit?, cwd?)`: Returns a list of `CommitSummary` containing full hash, short hash, author, date, and commit subject.

### REQ-GS-5: Revision File Content (Show) Capability
`GitService` MUST provide:
- `getFileContent(ref, path, cwd?)`: Returns the raw string content of a file at the given Git ref.

### REQ-GS-6: Dependency Injection & Testability
`main()` in `src/cli/main.ts` and `App` in `src/ui/app.tsx` MUST allow injecting custom `GitService` instances for isolated, mockable testing.
