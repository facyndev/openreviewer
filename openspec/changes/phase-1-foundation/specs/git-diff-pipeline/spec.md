# Spec: git-diff-pipeline

## Purpose

Read-only retrieval and typed representation of git diffs; the single source of change data.

## ADDED Requirements

### Requirement: Diff retrieval

The system MUST retrieve diffs by running `git diff --no-color --no-ext-diff <range>` via child_process with the repository as cwd, and MUST NOT modify the repository.

#### Scenario: happy path

GIVEN a repo with commits, WHEN a range resolves, THEN the raw unified diff is returned.

#### Scenario: empty range

GIVEN two identical refs, WHEN retrieved, THEN an empty diff is returned without error.

### Requirement: Diff parsing

The system MUST parse unified diff output into typed domain objects: `FileDiff` (status, oldPath, newPath), `Hunk` (header, line range), `Line` (kind: added/removed/context; text; old/new line numbers). Parsing MUST fail over to a `FileDiff.kind = binary|unknown` representation rather than crashing on binary content or renames.

#### Scenario: modified file

GIVEN a file with +/-/context lines, WHEN parsed, THEN hunks and line kinds match the input exactly.

#### Scenario: binary or rename

GIVEN git output saying `Binary files differ` or a rename header, WHEN parsed, THEN a typed FileDiff preserves the paths/kind WITHOUT loss.

### Requirement: Line-number mapping

The system MUST map hunk headers (`@@ -a,b +c,d @@`) so each added line carries its new-side number and each removed line its old-side number.

#### Scenario: mixed hunk

GIVEN interleaved +/- lines, WHEN mapped, THEN every line has the correct side number AND no line is left unnumbered.