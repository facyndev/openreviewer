# Tasks: phase-1-foundation (Node.js + TypeScript)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: scaffold + git pipeline + CLI → PR 2: Ink TUI |
| Delivery strategy | ask-on-risk (resolved: chained PRs, user-approved) |
| Chain strategy | stacked-to-main (user-approved) |

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Scaffold + git pipeline + CLI (types, parser, repo, diff, args) | PR 1 | `npx vitest run src/git src/cli` | N/A — integration via real git spawn in tmp fixture repos | delete src/git + src/cli + package.json; undo git init |
| 2 | Ink TUI + wiring (app, filetree, diffview, statusbar, keymap) | PR 2 | `npx vitest run src/ui` + `npm run typecheck` | `npm run dev -- --diff HEAD~1..HEAD` in fixture repo | delete src/ui + bin/; revert App wiring |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 `git init` workspace; create `package.json` (name openreviewer, bin `openreviewer` → bin shim, scripts: dev `tsx src/cli/main.ts`, test `vitest run`, typecheck `tsc --noEmit`, build `tsc`; deps: ink, react, parse-diff, smol-toml (config later), dev: typescript, tsx, vitest, @types/node, @types/react, ink-testing-library, eslint, prettier)
- [x] 1.2 Create `tsconfig.json` (strict, NodeNext, outDir dist), `vitest.config.ts`, `bin/openreviewer` shim, eslint/prettier base
- [x] 1.3 RED test `src/cli/args.test.ts`: refs starting with `-` (e.g. `--output=x`), whitespace, NUL/newline rejected (threat matrix: repo selection)
- [x] 1.4 Create `src/git/types.ts` domain types: `Line`, `Hunk`, `FileDiff`, `FileStatus`, `DiffResult` (REQ-4)

## Phase 2: Core Implementation

- [x] 2.1 RED golden tests `src/git/parser.test.ts` + `tests/fixtures/` (modified/binary/rename/empty) (REQ-4, REQ-5)
- [x] 2.2 Create `src/git/parser.ts` (parse-diff + own `@@` line-number mapping) — pass goldens (REQ-5)
- [x] 2.3 RED test `src/git/repo.test.ts`: non-repo → typed error; `rev-parse` root used as cwd authority
- [x] 2.4 Create `src/git/repo.ts` `resolveRoot()` via `git rev-parse --show-toplevel`
- [x] 2.5 RED tests `src/git/diff.test.ts`: default `git diff HEAD` shows staged+unstaged; identical refs → empty diff, no error (threat matrix: commit state)
- [x] 2.6 Create `src/git/diff.ts` `fetchDiff(refs)` spawn array wrapper (`--no-color --no-ext-diff`, given-range override)

## Phase 3: CLI + TUI

- [x] 3.1 Create `src/cli/main.ts` (`--diff`/`--from`/`--to` parse, HEAD defaults, lowercase stderr + non-zero exits, TUI entry) — pass 1.3
- [x] 3.2 RED unit tests `src/ui/keymap.test.ts` (j/k/h/l/Enter/Tab/q/? transitions)
- [x] 3.3 Create `src/ui/keymap.ts` + `src/ui/app.tsx` reducer (REQ-6, REQ-7, REQ-8 state)
- [x] 3.4 Create `src/ui/filetree.tsx` (badges, empty state) + `src/ui/diffview.tsx` (unified colors, pane focus) + `src/ui/statusbar.tsx`; ink-testing-library tests (tree badges, empty state, help overlay, quit code 0)
- [x] 3.5 Wire CLI → App; smoke `npm run dev -- --diff HEAD~1..HEAD` renders (REQ-1, REQ-2)

## Phase 4: Verification / Cleanup

- [x] 4.1 Full `npm test` + `npm run typecheck` + `npm run lint` green against all spec scenarios REQ-1..REQ-8
- [x] 4.2 README quick-start (install, refs syntax); remove dead scaffolding; confirm AGENTS.md consistent

## PR Boundary (stacked to main)

- **PR 1 (work unit 1) DONE**: tasks 1.1–1.4, 2.1–2.6, 3.1 (CLI parse/exit, no TUI) + their tests. Focused command: `npx vitest run src/git src/cli` → 18 passed. Commits 45d2c34..5ed20fc. Runtime harness: real git spawns in tmp repos (test-helpers.ts). Rollback: delete src/git + src/cli + package.json.
- **PR 2 (work unit 2) DONE**: tasks 3.2–3.5, 4.1–4.2 (TUI + wiring + docs). Focused command: `npx vitest run src/ui` → 19 passed + typecheck clean. Commits b476c90..a53dea5. Runtime harness: ink-testing-library + renderToString (Ink needs a real TTY for interactive smoke — documented limitation). Rollback: delete src/ui + bin/ + revert App wiring.