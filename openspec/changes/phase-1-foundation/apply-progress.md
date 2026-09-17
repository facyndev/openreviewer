# Apply Progress: phase-1-foundation (PR 1 + PR 2)

## Work Unit 1 (PR 1, stacked to main) DONE. Tasks 1.1–1.4, 2.1–2.6, 3.1 complete.

| Evidence | Value |
|---|---|
| Focused test command + result | `npx vitest run src/git src/cli` → 18 passed (4 files, 0 failed) |
| Runtime harness | N/A as standalone — integration covered by real spawned git in temp repos (src/git/test-helpers.ts makeRepo/git) |
| Rollback boundary | delete src/git + src/cli + package.json; undo git init |

## Work Unit 2 (PR 2, stacked to main) DONE. Tasks 3.2–3.5, 4.1–4.2 complete.

| Evidence | Value |
|---|---|
| Focused test command + result | `npx vitest run src/ui` → 19 passed (3 files); full `npm test` → 37/37 |
| Runtime harness | ink-testing-library 4.0.0 + `renderToString` integration; interactive smoke `npm run dev -- --diff HEAD~1..HEAD` needs a real TTY (Ink) — documented limitation |
| Rollback boundary | delete src/ui; revert src/cli/main.ts wiring; drop ink/react deps |

## Verification record (PR 2)

- `npm test` → 37/37 (19 UI: keymap 8 + reducer/ITL 9 + renderToString 2)
- `npm run typecheck` → clean; `npm run lint` → clean (after removing unused `onClose` prop from HelpPanel); `npm run build` → dist ok; `node bin\openreviewer --help` → usage, exit 0
- Real-TTY smoke not runnable from this shell — covered by ITL + renderToString integration tests

## Commits PR 1 (main base)

45d2c34 chore: scaffold node/typescript project with vitest and eslint
aee5767 docs: align AGENTS.md with node/typescript stack
c06b939 feat: add git diff domain types
448a852 feat: parse unified diffs from golden fixtures
e46956b feat: spawn git for repo root and diff fetching
540fb42 feat: add cli arg parsing and entry point
5ed20fc test: split repo root resolution tests into repo.test.ts
5a0ccbc chore: ignore runtime skill droppings (.agents, skills-lock.json)

## Commits PR 2 (on main, after PR 1)

b476c90 feat(ui): key bindings and shared TUI types (Pane/ViewMode moved here)
c18301a feat(ui): diff TUI screens (tree, diff, status bar, help)
647b8ef feat(ui): App shell with keyboard navigation
fcdd15d feat(cli): render the TUI from the cli entry (render + waitUntilExit + exit 0)
f5c4d91 docs: quick start for openreviewer
a53dea5 chore: ink and react deps, jsx runtime (ink 7.1.1, react 19.3.0; tsconfig jsx react-jsx)

## Deviations from design (PR 2)

1. Ink 7 + yoga truncate text in a row with `justifyContent="space-between"` and two children — StatusBar renders one nested Text instead (no layout squeeze).
2. ink-testing-library Stdin emits synchronously: tests must await a tick after render before `stdin.write`, or Ink's data listener is not attached yet.
3. useInput remains `isActive: true` while help is open, but App filters non-? keys so the help overlay can close itself.
4. HelpPanel no longer takes `onClose` (App dispatches toggle_help); side-by-side rendering deferred — Tab toggles viewMode state; DiffView renders unified (status bar shows the mode).
5. vitest include widened: `src/**/*.test.{ts,tsx}` (tsx tests were silently skipped before).
6. Ledger evidence: PR2 settle uses sha256:5a254df0a8d855f16cb4512d67b21edc693f2d42b967e414fffa0800bff2e468 (full-tree diff from empty tree, 34 files / 5410 lines — includes PR 1 lines after maintainer-waived reset).

## Next

Verify phase (stable), then create PR 1 + PR 2 via chained-pr skill (stacked-to-main: PR 1 first). Then archive; roadmap continues to remaining phases.