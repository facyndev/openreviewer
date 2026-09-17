# OpenReviewer

> A terminal-native code review tool that brings clarity to every diff — whether the author is a human or an AI agent.

## Quick start

Requirements: Node.js >= 20.

```sh
npm install
npm run build
# from inside any git repository:
npm run dev -- --diff HEAD~3..HEAD
# or open the default working-tree diff (staged and unstaged):
npm run dev
```

Once the TUI is open:

| Key       | Action                      |
| --------- | --------------------------- |
| `j` / `k` | Move up/down in the file tree |
| `h` / `l` | Switch between tree and diff panes |
| `Enter`   | Open the selected file's diff |
| `Tab`     | Toggle side-by-side / unified (side-by-side lands in a later phase) |
| `?`       | Help overlay                |
| `q`       | Quit                        |

## Refs syntax

- `--diff <a..b>` — review the range between two refs (commits, branches, tags).
- `--from <ref>` / `--to <ref>` — the missing side defaults to `HEAD`.
- No flag — `git diff HEAD` (working tree, staged and unstaged).

## Principles

- Git is the truth: OpenReviewer only reads the repository, never modifies it.
- Offline-first: diff viewing works fully offline; AI review is additive.
- CLI-first, TUI-second: every TUI action is reachable from the CLI for scripting.

## Development

```sh
npm test        # vitest (unit + git integration)
npm run typecheck
npm run lint
```

Run tests against the pipeline: `npx vitest run src/git src/cli src/ui`.