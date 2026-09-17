# OpenReviewer

> A terminal-native code review tool that brings clarity to every diff — whether the author is a human or an AI agent.

## Vision

OpenReviewer is a **TUI (Terminal User Interface)** that helps developers review, understand, and approve code changes. It is built around Git as the single source of truth and supports pluggable AI providers (OpenAI, Anthropic Claude, Google Gemini, local models via Ollama, etc.) to generate intelligent review feedback.

The core insight: modern developers increasingly work alongside AI coding agents that produce large volumes of changes. Existing review tools (GitHub PR UI, `git diff`) were designed for human-authored, small commits. **OpenReviewer is purpose-built for high-volume, AI-assisted workflows** while remaining equally powerful for traditional human-to-human code review.

## Core Features

### 1. Git-Native Diff Explorer
- Side-by-side and unified diff views for any two refs (commits, branches, tags).
- File tree navigation with change indicators (added, modified, deleted, renamed).
- Hunk-level and line-level granularity.
- Inline annotations and comments that persist locally.

### 2. AI-Powered Review
- Pluggable provider architecture: OpenAI, Anthropic, Google, Ollama, or any OpenAI-compatible API.
- Review modes:
  - **Full Review**: Analyze the entire diff for bugs, style issues, security concerns, and improvement suggestions.
  - **Explain**: Summarize what a changeset does in plain language.
  - **Focused Review**: Review only selected files or hunks.
  - **Ask**: Interactive Q&A about the code changes.
- Provider configuration via a simple TOML config file (`~/.config/openreviewer/config.toml`).

### 3. Session & History
- Review sessions are persisted locally (SQLite or JSON).
- Revisit past reviews, compare how a file evolved across sessions.
- Export reviews as Markdown reports.

### 4. Integration Points
- Works standalone on any local Git repository.
- Optional GitHub/GitLab integration: fetch PR/MR diffs, post review comments back.
- Pipe-friendly: `openreviewer --diff HEAD~3..HEAD --provider openai --output review.md`.

## Technology Stack

| Layer            | Technology                  | Rationale                                                        |
| ---------------- | --------------------------- | ---------------------------------------------------------------- |
| Language         | **Node.js ≥ 20 (LTS) + TypeScript** | Mature ecosystem, fast iteration, excellent terminal tooling  |
| TUI Framework    | **Ink** (React)             | Declarative composable components, testable, de facto Node TUI  |
| Styling          | **Ink + Chalk**             | Component-level styling; Chalk for non-React terminal output    |
| Git Operations   | **shell `git`** (child_process) | Exact user-visible git output; no algorithm drift; edge-case fallback built in |
| AI Providers     | Custom HTTP client layer    | Thin adapters per provider (fetch/undici), no heavy SDKs        |
| Config           | **TOML** (smol-toml)        | Human-readable, widely adopted for CLI tools                    |
| Persistence      | **SQLite** (better-sqlite3) | Mature, synchronous, perfect for local state                    |
| Syntax Highlight | **highlight.js**            | Broad language coverage for diff highlighting                   |

## Architecture

```
openreviewer/
├── bin/                        # CLI entry points
│   └── openreviewer            # Executable shim → src/cli/main.ts
├── src/
│   ├── cli/                    # CLI entry & argument parsing
│   │   └── main.ts
│   ├── app/                    # Application orchestration (Ink program)
│   │   ├── app.tsx             # Root component, message/state routing
│   │   └── keymap.ts           # Global key bindings
│   ├── ui/                     # TUI components (Ink/React)
│   │   ├── diffview/           # Side-by-side and unified diff viewer
│   │   ├── filetree/           # File tree navigator with change badges
│   │   ├── reviewpanel/        # AI review results panel
│   │   ├── statusbar/          # Bottom status bar
│   │   ├── commandbar/         # Command palette / search bar
│   │   └── dialog/             # Modal dialogs (confirm, input, etc.)
│   ├── git/                    # Git operations abstraction
│   │   ├── diff.ts             # Diff parsing and representation
│   │   ├── repo.ts             # Repository operations (log, refs, blame)
│   │   └── types.ts            # Domain types (Hunk, FileDiff, etc.)
│   ├── review/                 # Review engine
│   │   ├── engine.ts           # Orchestrates AI calls, builds prompts
│   │   ├── prompt.ts           # Prompt templates for different review modes
│   │   └── result.ts           # Review result types
│   ├── providers/              # AI provider adapters
│   │   ├── provider.ts         # Provider interface
│   │   ├── openai/             # OpenAI adapter
│   │   ├── anthropic/          # Anthropic Claude adapter
│   │   ├── google/             # Google Gemini adapter
│   │   ├── ollama/             # Ollama (local models) adapter
│   │   └── registry.ts         # Provider registry and factory
│   ├── config/                 # Configuration loading
│   │   └── config.ts
│   ├── session/                # Review session persistence
│   │   ├── store.ts            # Session storage interface
│   │   └── sqlite.ts           # SQLite implementation
│   └── export/                 # Export reviews to Markdown, JSON, etc.
│       └── markdown.ts
├── config.example.toml         # Example configuration file
├── package.json
├── tsconfig.json
├── LICENSE
├── README.md
└── AGENTS.md
```

### Key Design Principles

1. **Provider as a Plugin**: The `Provider` interface is the only contract AI adapters implement. Adding a new provider means one file, zero changes elsewhere.
2. **Git is the Truth**: All change data comes from Git. OpenReviewer never modifies the repository — it is strictly read-only.
3. **Offline-First**: The tool works fully offline for diff viewing. AI features are additive, never required.
4. **Composable UI**: Each TUI component is a standalone Ink component. Components communicate through state/events, never direct references.
5. **CLI-First, TUI-Second**: Every action available in the TUI must also be accessible via CLI flags for scripting and CI pipelines.

## Conventions

### Code Style
- Follow modern TypeScript conventions (`tsc --noEmit`, `eslint`, `prettier`).
- Use Vitest with table-driven and golden-file tests.
- Error messages are lowercase, no trailing punctuation.
- Module names are short, singular nouns; shared contracts use `type` exports.

### Git Workflow
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Branch naming: `feat/short-description`, `fix/short-description`.

### Configuration
- User config: `~/.config/openreviewer/config.toml`
- Project overrides: `.openreviewer.toml` in the repo root.
- Environment variables: `OPENREVIEWER_` prefix (e.g., `OPENREVIEWER_PROVIDER`, `OPENREVIEWER_API_KEY`).

### AI Provider Interface

```ts
// Provider defines the contract for AI review providers.
export interface Provider {
  // name returns the provider identifier (e.g., "openai", "anthropic").
  readonly name: string

  // review sends a diff for AI review and returns structured feedback.
  review(req: ReviewRequest): Promise<ReviewResult>

  // explain generates a plain-language summary of changes.
  explain(req: ExplainRequest): Promise<ExplainResult>

  // ask handles interactive Q&A about code changes.
  ask(req: AskRequest): Promise<AskResult>

  // supportsStreaming indicates if the provider supports streaming responses.
  readonly supportsStreaming: boolean

  // stream sends a review request and streams the response token by token.
  stream(req: ReviewRequest): AsyncIterable<StreamChunk>
}
```

### Key Bindings (Default)

| Key         | Action                          |
| ----------- | ------------------------------- |
| `j` / `k`   | Navigate up/down               |
| `h` / `l`   | Collapse/expand or switch panes |
| `Enter`     | Open file diff                  |
| `Tab`       | Toggle side-by-side / unified   |
| `r`         | Run AI review on current file   |
| `R`         | Run AI review on entire diff    |
| `e`         | Explain current changes         |
| `a`         | Ask AI a question               |
| `c`         | Add inline comment              |
| `s`         | Save session                    |
| `x`         | Export review as Markdown       |
| `/`         | Search in diff                  |
| `?`         | Show help                       |
| `q`         | Quit                            |

## Development Roadmap

### Phase 1 — Foundation
- [ ] Project scaffolding (Node.js + TypeScript package, directory structure).
- [ ] Git diff parsing and domain types.
- [ ] Basic TUI: file tree + unified diff viewer.
- [ ] Navigation and key bindings.

### Phase 2 — AI Integration
- [ ] Provider interface and registry.
- [ ] OpenAI adapter (first provider).
- [ ] Review engine with prompt templates.
- [ ] Review results panel in TUI.

### Phase 3 — Polish & Persistence
- [ ] Side-by-side diff view.
- [ ] Syntax highlighting in diffs.
- [ ] Session persistence (SQLite).
- [ ] Inline comments.

### Phase 4 — Ecosystem
- [ ] Additional providers (Anthropic, Google, Ollama).
- [ ] GitHub/GitLab PR integration.
- [ ] CLI-only mode for CI/CD pipelines.
- [ ] Export to Markdown/JSON.

## Non-Goals (For Now)
- OpenReviewer is **not** a Git client — it does not commit, push, or merge.
- OpenReviewer is **not** an IDE plugin — it is a standalone terminal tool.
- OpenReviewer does **not** enforce review approval gates — it is advisory.
