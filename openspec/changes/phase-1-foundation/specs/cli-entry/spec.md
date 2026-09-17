# Spec: cli-entry

## Purpose

Entry point for the `openreviewer` binary; validates invocation before the TUI starts.

## ADDED Requirements

### Requirement: CLI invocation

The `openreviewer` executable MUST start without arguments and MUST exit with code 0 on clean quit. Invalid invocations MUST print a lowercase error to stderr and exit non-zero.

#### Scenario: start

GIVEN a terminal, WHEN the user runs `openreviewer`, THEN the TUI renders AND a clean quit returns 0.

#### Scenario: invalid option

GIVEN an unknown flag, WHEN the user passes it, THEN stderr shows a lowercase error AND exit code is non-zero.

### Requirement: Ref range selection

The CLI MUST accept the diff range via `--diff <range>` (e.g. `HEAD~3..HEAD`) or `--from <ref> --to <ref>`; when only one side is given, the other MUST default to HEAD.

#### Scenario: explicit range

GIVEN `--diff HEAD~2..HEAD`, WHEN the app starts, THEN that range is used.

#### Scenario: unresolvable ref

GIVEN a ref git cannot resolve, WHEN the app starts, THEN a lowercase error is shown AND exit is non-zero.