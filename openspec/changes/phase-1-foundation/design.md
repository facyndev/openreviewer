# Design: phase-1-foundation (Node.js + TypeScript)

## Context

OpenReviewer runs as a terminal-native TUI over a read-only git diff pipeline. Phase 1 must scaffold a strict-TS Node package, retrieve+parse real git diffs, and render a basic diff explorer (file tree + unified view) with clean quit/help behavior. No AI provider work yet.

## Decisions

### Decision: Spawn git without shell

**Choice**: `child_process.spawn("git", [...args], { cwd })` — array form, no shell.
**Alternatives**: shell string template (rejected: injection + quoting pitfalls); execFile (OK but doesn't stream cleanly for large diffs).
**Rationale**: refs are user input; array args keep option/metacharacter injection out. Exact git output is the design goal.

### Decision: parse-diff for unified parsing, own domain mapping

**Choice**: parse unified text with `parse-diff`, then map result into own `FileDiff/Hunk/Line` types incl. line numbers from `@@` headers.
**Alternatives**: full custom parser (rejected: re-implementing header escapes/edge cases); raw line scan only (rejected: rename/binary headers get lossy).
**Rationale**: battle-tested unified handling; we own typing, status, and line-number mapping (REQ-4/REQ-5).

### Decision: Ink component model with central state

**Choice**: single Ink render tree; `useReducer` state in `App`; `useInput` (Ink) routes keys; FileTree/DiffView/StatusBar are pure presentational props components.
**Alternatives**: blessed (rejected: imperative, older patterns); raw ANSI (rejected: too much work, no composability).
**Rationale**: declarative composability per AGENTS.md; keymap module stays framework-free and unit-testable.

### Decision: Repo root discovery, never from user input

**Choice**: `git rev-parse --show-toplevel` resolves cwd; user flags carry refs ONLY.
**Alternatives**: accepting `-C`/paths from flags (rejected: authority confusion).
**Rationale**: threat matrix row "Git repository selection" — the process cwd is the only authority.

## Data Flow

```
main.ts ──parseArgs──> { from?, to? } ──> repo.resolveRoot() ──> diff.fetch(refs)
   ──> raw unified text ──> parser.parse(raw) ──> DiffResult { files: FileDiff[] }
   ──> App (Ink reducer) ──> FileTree | DiffView | StatusBar
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json`, `tsconfig.json`, `vitest.config.ts`, `bin/openreviewer` | Create | scaffold, strict TS, test config, bin shim |
| `src/cli/main.ts` | Create | arg parse (`--diff`/`--from`/`--to`), validation, error exits, TUI entry |
| `src/git/types.ts` | Create | `Line`, `Hunk`, `FileDiff`, `FileStatus` domain types |
| `src/git/repo.ts` | Create | `resolveRoot()` via `rev-parse --show-toplevel` |
| `src/git/parser.ts` | Create | unified parse (parse-diff) + line-number mapping |
| `src/git/diff.ts` | Create | `fetchDiff(refs)` spawn wrapper, empty-diff handling |
| `src/ui/app.tsx`, `filetree.tsx`, `diffview.tsx`, `statusbar.tsx`, `keymap.ts` | Create | Ink components + keymap module (j/k/h/l/Enter/Tab/q/?) |
| `tests/fixtures/*.diff`, `src/**/*.test.ts` | Create | golden diffs + unit/integration tests |

## Interfaces / Contracts

```ts
type LineKind = 'added' | 'removed' | 'context'
interface Line { kind: LineKind; text: string; oldNo?: number; newNo?: number }
interface Hunk { header: string; oldStart: number; oldLines: number; newStart: number; newLines: number; lines: Line[] }
type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'binary' | 'unknown'
interface FileDiff { status: FileStatus; oldPath: string; newPath: string; hunks: Hunk[] }
type DiffResult = { files: FileDiff[] }
interface CliArgs { range?: { from: string; to: string } }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | parser (golden), args validation, keymap transitions | vitest table + golden files |
| Integration | fetchDiff against real temp repos (fixtures created in test tmpdir) | `child_process` git, assert typed output |
| Component | TUI render (tree badges, empty state, help overlay) | ink-testing-library render assertions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Diff parse edge cases (rename/binary/CRLF) | Med | golden tests; `--no-ext-diff`; fixtures |
| No git repo in workspace | High | `git init` early in Phase 1 |
| Ink layout complexity for panes | Med | prototype early; blessed fallback |
| Windows path/encoding quirks | Med | test on win32 (current env) |

## Threat Matrix

| Boundary | Applicability | Design response | Planned RED tests |
|----------|--------------|-----------------|-------------------|
| Documentation-like paths | N/A — no file execution in Phase 1 | — | none |
| Git repository selection | Applicable — refs are user input into a git subprocess | Refs validated: reject leading `-`, whitespace, NUL/newline; cwd from `rev-parse`, never from flags; spawn array args | injection ref `--output=x` rejected; space ref rejected; root cwd wins |
| Commit state | Applicable — default (no range) is `git diff HEAD` (worktree+index vs HEAD) | Explicit range overrides default; identical refs → empty diff, no error | staged+unstaged shown by default; identical refs → empty |
| Push state | N/A — no push automation in Phase 1 | — | none |
| PR commands | N/A — no PR commands in Phase 1 | — | none |

## Migration / Rollout

No migration. `git init` the workspace early as a dev fixture.

## Open Questions

- [x] npm vs pnpm for the scaffold (resolved: npm, default).