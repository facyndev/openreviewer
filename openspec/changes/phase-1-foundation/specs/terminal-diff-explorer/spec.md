# Spec: terminal-diff-explorer

## Purpose

Ink-based TUI: navigate changed files, inspect unified diffs, quit cleanly.

## ADDED Requirements

### Requirement: File tree navigation

The TUI MUST render a tree of changed files with change badges (added/modified/deleted/renamed), MUST support `j`/`k` navigation, and `Enter` must open the selected file's diff.

#### Scenario: populated tree

GIVEN a diff with 3 files, WHEN the TUI starts, THEN the tree shows 3 entries with correct badges AND focus is on the first.

#### Scenario: empty tree

GIVEN an empty diff, WHEN the TUI starts, THEN an empty-state message is shown without crashing.

### Requirement: Unified diff view

The TUI MUST render the selected file's hunks in unified view, MUST visually distinguish added and removed lines, and MUST support `h`/`l` pane focus switching. Side-by-side rendering is out of scope (Phase 3).

#### Scenario: line coloring

GIVEN a file with additions and deletions, WHEN opened, THEN added and removed lines render distinctly.

#### Scenario: pane switch

GIVEN focus on the tree, WHEN `l` is pressed, THEN focus moves to the diff pane.

### Requirement: Help and quit

The TUI MUST provide a help overlay on `?` and MUST quit cleanly on `q` from the main view.

#### Scenario: help

GIVEN the main view, WHEN `?` is pressed, THEN the help overlay shows with the default keymap.

#### Scenario: quit

GIVEN the main view, WHEN `q` is pressed, THEN the process exits with code 0.