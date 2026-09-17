# Proposal: Phase 1 Foundation (Node.js + TypeScript)

> NOTE (proposal adjustment, user-approved): AGENTS.md technical stack was already rewritten to Node.js/TypeScript during proposal adjustment (2026-09-16): tech-stack table, architecture tree, design principles, code conventions, Provider interface (TS), and Phase 1 scaffold wording. The success criterion "AGENTS.md reflects Node.js stack" is therefore already satisfied.

## Why

OpenReviewer is a terminal-native code-review TUI (AGENTS.md). User decision (2026-09-16): build on **Node.js + TypeScript**, not Go. This change delivers Phase 1: scaffold, git diff pipeline, and a basic diff explorer TUI.

## What Changes

### In Scope

- Node.js + TypeScript scaffold: `openreviewer` bin, strict tsconfig, vitest
- Git diff retrieval + parsing + domain types (FileDiff, Hunk, Line)
- Basic TUI: file tree with change badges + unified diff viewer
- Navigation & key bindings (j/k/h/l/Enter/Tab/q/?)
- AGENTS.md stack section updated to Node.js — **DONE during proposal adjustment**

### Out of Scope

- AI providers, review engine, results panel (Phase 2)
- Side-by-side diff, highlighting, persistence, inline comments (Phase 3)
- Extra providers, GitHub integration, exports, CLI-only mode (Phase 4)

## Capabilities

### New Capabilities

- `cli-entry`: CLI entry, ref-pair selection for the diff
- `git-diff-pipeline`: diff retrieval, parsing, domain types
- `terminal-diff-explorer`: file tree + unified diff navigation

### Modified Capabilities

None (pre-scaffold).

## Approach

- Scaffold minimal Node 20+ TS package (npm, strict TS, vitest configured, bin `openreviewer`).
- Diff: spawn `git diff --no-color --no-ext-diff <refs>`; parse unified output (parse-diff lib) into domain types; golden-file tests for edge cases.
- TUI: Ink (React) with composable pane components mirroring AGENTS.md composable-UI principle; keymap model separate.
- Tests-first: golden + table tests for pipeline; unit tests for keymap; `npm test` becomes strict-TDD baseline.

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `package.json`, `tsconfig.json` | New | scaffold, bin, test setup |
| `src/git/diff.ts`, `src/git/repo.ts`, `src/git/types.ts` | New | diff pipeline + domain |
| `src/ui/filetree.tsx`, `src/ui/diffview.tsx`, `src/ui/keymap.ts` | New | TUI components |
| `AGENTS.md` | Modified | stack → Node.js (DONE); roadmap cleanup on phase completion |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Diff parse edge cases (rename/binary/CRLF) | Med | golden tests; `--no-ext-diff`; fixtures |
| No git repo in workspace | High | `git init` early in Phase 1 |
| Ink layout complexity for panes | Med | prototype early; blessed fallback |
| Windows path/encoding quirks | Med | test on win32 (current env) |

## Rollback Plan

Pre-repo: delete scaffold files, revert AGENTS.md (restore Go version). Post-repo: revert commit(s). No data migration.

## Dependencies

- Node.js >= 20 (verify at apply), git >= 2.x on PATH.

## Success Criteria

- [x] `npm test` green (pipeline golden tests + unit)
- [x] `npm run typecheck` (tsc --noEmit) clean
- [x] TUI renders file tree + unified diff for a real ref pair (verified via ink-testing-library + renderToString; interactive smoke needs a real TTY)
- [x] AGENTS.md reflects Node.js stack (DONE)