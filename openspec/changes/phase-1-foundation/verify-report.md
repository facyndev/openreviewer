# Verify Report: phase-1-foundation (PR 1 + PR 2)

**Status: PASS** — 2026-09-16

## Verification Gates

| Command | Result |
|---|---|
| `npm test` | 37/37 passed (7 files) |
| `npm run typecheck` | clean (tsc --noEmit) |
| `npm run lint` | clean (eslint src) |
| `npm run build` | dist OK |
| `node bin\openreviewer --help` | usage printed, exit 0 |

## Give specification coverage

### Domain: cli-entry

| Requirement | Scenarios | Evidence | Verdict |
|---|---|---|---|
| CLI invocation | start; invalid option | `src/cli/main.ts` renders App + `waitUntilExit()` + `process.exit(0)`; `bin/openreviewer` shim smoke exit 0; `app.test.tsx` q-handling; `src/cli/args.test.ts` invalid flags → lowercase stderr + exit 1 | PASS |
| Ref range selection | explicit range; unresolvable ref | `src/cli/args.ts` `--diff`/`--from`/`--to` validation; `args.test.ts` explicit range parse; `main.ts` error path exits non-zero on git failure (empty-repo smoke) | PASS |

### Domain: git-diff-pipeline

| Requirement | Scenarios | Evidence | Verdict |
|---|---|---|---|
| Diff retrieval | happy path; empty range | `src/git/diff.ts` spawn array (`--no-color --no-ext-diff`), repo cwd; `diff.test.ts` real temp repos (happy range returns raw diff; identical refs → empty, no error) | PASS |
| Diff parsing | modified file; binary or rename | `src/git/parser.ts` (parse-diff + raw-section scan); `parser.test.ts` golden fixtures modified/binary/rename; paths + status preserved without loss | PASS |
| Line-number mapping | mixed hunk | parser own `@@` mapping; `parser.test.ts` asserts every added/removed line numbered | PASS |

### Domain: terminal-diff-explorer

| Requirement | Scenarios | Evidence | Verdict |
|---|---|---|---|
| File tree navigation | populated tree; empty tree | `src/ui/filetree.tsx` badges (added/modified/deleted/renamed) + empty state; `app.test.tsx` populated render (badges, first focus) + empty-state no-crash; `j/k`/Enter reducer tests | PASS |
| Unified diff view | line coloring; pane switch | `src/ui/diffview.tsx` added/removed distinct colors; `app.test.tsx` `l` from tree → diff pane (reducer switch_pane); side-by-side deferred (spec out of scope) | PASS |
| Help and quit | help; quit | `app.test.tsx` `?` opens overlay with `KEY_HINTS` and closes again; `q` clean exit; `src/ui/keymap.ts` + `keymap.test.ts` (8 transitions) | PASS |

## Findings

### CRITICAL

None.

### WARNING

- **W1 (documented limitation)**: real-TTY interactive smoke (`npm run dev -- --diff HEAD~1..HEAD`) cannot run headless — Ink requires a TTY. Covered by ink-testing-library (9) + renderToString (2) integration tests. Action: user should run the smoke once in a real terminal before relying on the TUI daily.

### SUGGESTION

- **S1**: `Tab` toggles `viewMode` state (unified ↔ side-by-side) and the status bar shows the mode, but DiffView renders unified only — side-by-side rendering is Phase 3 per spec; no action needed now.
- **S2**: `pnpm-lock.yaml` + `pnpm-workspace.yaml` appear untracked in the worktree (user-added). Package manager decision recorded as npm default; confirm intent before committing either lockfile.
- **S3**: AGENTS.md roadmap still lists Phase 1 items as unchecked; user preference (mem obs 386) asks removing completed roadmap phases on phase completion — apply during archive/cleanup commit.

## Conclusion

**PASS** — all REQ-1..REQ-8 requirements and scenarios verified against source + tests + CLI smoke. No CRITICAL findings; one documented runtime limitation (W1) and three non-blocking suggestions.