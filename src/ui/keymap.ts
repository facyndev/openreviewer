/** Global key bindings and shared TUI types (AGENTS.md default keymap). */

export type Pane = 'tree' | 'diff'
export type ViewMode = 'unified' | 'side-by-side'

import type { FileDiff } from '../services/git/index.js'

export type Action =
  | { kind: 'move_up' }
  | { kind: 'move_down' }
  | { kind: 'scroll_line_up' }
  | { kind: 'scroll_line_down' }
  | { kind: 'scroll_page_up' }
  | { kind: 'scroll_page_down' }
  | { kind: 'scroll_home' }
  | { kind: 'scroll_end' }
  | { kind: 'scroll_left' }
  | { kind: 'scroll_right' }
  | { kind: 'switch_pane' }
  | { kind: 'open_file' }
  | { kind: 'toggle_mode' }
  | { kind: 'toggle_help' }
  | { kind: 'quit' }
  | {
      kind: 'set_viewport'
      treeVisibleRows: number
      diffVisibleRows: number
      diffVisibleCols: number
    }
  | {
      kind: 'reload_diff'
      files: FileDiff[]
      branch?: string
      commitHash?: string
    }

export interface KeyFlags {
  upArrow?: boolean
  downArrow?: boolean
  leftArrow?: boolean
  rightArrow?: boolean
  pageUp?: boolean
  pageDown?: boolean
  ctrl?: boolean
  shift?: boolean
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
  if (key.pageDown || (key.ctrl && input === 'd')) return { kind: 'scroll_page_down' }
  if (key.pageUp || (key.ctrl && input === 'u')) return { kind: 'scroll_page_up' }
  if (input === 'g') return { kind: 'scroll_home' }
  if (input === 'G') return { kind: 'scroll_end' }
  if (input === 'j' || key.downArrow) return { kind: 'move_down' }
  if (input === 'k' || key.upArrow) return { kind: 'move_up' }
  if (input === 'l' || key.rightArrow) return { kind: 'switch_pane' }
  if (input === 'h' || key.leftArrow) return { kind: 'switch_pane' }
  if (input === '\r' || key.return) return { kind: 'open_file' }
  if (input === '\t' || key.tab) return { kind: 'toggle_mode' }
  return null
}