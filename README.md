# openreviewer

Terminal-native code review tool that inspects git diffs with side-by-side navigation, live repository watching, and support for all staged, unstaged, and untracked changes.

## Quick start

Node.js >= 20 is required.

1. Install dependencies:
   ```sh
   npm install
   ```
2. Build the project:
   ```sh
   npm run build
   ```
3. Launch the review interface inside any git repository:
   ```sh
   # review working tree changes (staged, unstaged, and untracked):
   npm run dev

   # or review a specific commit range:
   npm run dev -- --diff HEAD~3..HEAD
   ```

## Key bindings

| Key | Action |
| --- | --- |
| `j` / `k` | Navigate files or scroll diff rows down/up |
| `h` / `l` | Switch between file tree and diff view |
| `Enter` | Focus diff view for selected file |
| `Tab` | Toggle side-by-side and unified diff layout |
| `?` | Toggle help modal overlay |
| `q` | Exit application |

## Diff modes and syntax

| Option | Behavior |
| --- | --- |
| `(no flags)` | Default mode. Inspects working tree changes against HEAD (staged, unstaged, and untracked files). |
| `--diff <a..b>` | Compares commit ranges, branch names, or tags. |
| `--from <ref>` | Compares specified reference against HEAD. |
| `--to <ref>` | Compares HEAD against specified reference. |

## Core principles

| Area | Principle |
| --- | --- |
| Single source of truth | Git process execution drives all repository state; the tool is strictly read-only. |
| Clean architecture | Domain contracts live in ports (`GitService`), decoupled from UI components and concrete adapters. |
| Real-time watcher | File changes debounce and trigger live UI reloads without losing tree selection or diff scroll state. |
| Offline first | Core navigation and diff visualization never depend on external network services. |

## Development

Run tests and quality checks from the project root:

```sh
npm test              # runs vitest unit and integration suite
npm run typecheck     # verifies typescript types
npm run lint          # runs eslint checks
npm run build         # compiles typescript to dist
```