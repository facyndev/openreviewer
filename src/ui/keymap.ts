/** Global key bindings and shared TUI types (AGENTS.md default keymap). */

export type Pane = 'tree' | 'diff'
export type ViewMode = 'unified' | 'side-by-side'

export type Action =
  | { kind: 'move_up' }
  | { kind: 'move_down' }
  | { kind: 'switch_pane' }
  | { kind: 'open_file' }
  | { kind: 'toggle_mode' }
  | { kind: 'toggle_help' }
  | { kind: 'quit' }

export interface KeyFlags {
  upArrow?: boolean
  downArrow?: boolean
  leftArrow?: boolean
  rightArrow?: boolean
  tab?: boolean
  return?: boolean
}

export const KEY_HINTS: Array<[string, string]> = [
  ['j/k', 'move'],
  ['l/h', 'pane'],
  ['Enter', 'open file'],
  ['Tab', 'view mode'],
  ['?', 'help'],
  ['q', 'quit'],
]

export function mapKey(input: string, key: KeyFlags): Action | null {
  if (input === 'q') return { kind: 'quit' }
  if (input === '?') return { kind: 'toggle_help' }
  if (input === 'j' || key.downArrow) return { kind: 'move_down' }
  if (input === 'k' || key.upArrow) return { kind: 'move_up' }
  if (input === 'l' || key.rightArrow) return { kind: 'switch_pane' }
  if (input === 'h' || key.leftArrow) return { kind: 'switch_pane' }
  if (input === '\r' || key.return) return { kind: 'open_file' }
  if (input === '\t' || key.tab) return { kind: 'toggle_mode' }
  return null
}