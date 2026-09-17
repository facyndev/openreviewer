import { describe, expect, it } from 'vitest'
import { KEY_HINTS, mapKey } from './keymap.js'

describe('mapKey (REQ-8 state transitions)', () => {
  it('maps j and downArrow to move_down', () => {
    expect(mapKey('j', {})).toEqual({ kind: 'move_down' })
    expect(mapKey('', { downArrow: true })).toEqual({ kind: 'move_down' })
  })

  it('maps k and upArrow to move_up', () => {
    expect(mapKey('k', {})).toEqual({ kind: 'move_up' })
    expect(mapKey('', { upArrow: true })).toEqual({ kind: 'move_up' })
  })

  it('maps h/l and arrows to switch_pane', () => {
    expect(mapKey('h', {})).toEqual({ kind: 'switch_pane' })
    expect(mapKey('l', {})).toEqual({ kind: 'switch_pane' })
    expect(mapKey('', { leftArrow: true })).toEqual({ kind: 'switch_pane' })
    expect(mapKey('', { rightArrow: true })).toEqual({ kind: 'switch_pane' })
  })

  it('maps Enter/return to open_file', () => {
    expect(mapKey('\r', {})).toEqual({ kind: 'open_file' })
    expect(mapKey('', { return: true })).toEqual({ kind: 'open_file' })
  })

  it('maps Tab to toggle_mode', () => {
    expect(mapKey('\t', {})).toEqual({ kind: 'toggle_mode' })
    expect(mapKey('', { tab: true })).toEqual({ kind: 'toggle_mode' })
  })

  it('maps ? to toggle_help and q to quit', () => {
    expect(mapKey('?', {})).toEqual({ kind: 'toggle_help' })
    expect(mapKey('q', {})).toEqual({ kind: 'quit' })
  })

  it('returns null for unmapped input', () => {
    expect(mapKey('x', {})).toBeNull()
    expect(mapKey('', {})).toBeNull()
  })

  it('exposes key hints for the status bar', () => {
    expect(KEY_HINTS.map(([k]) => k)).toEqual(['j/k', 'l/h', 'Enter', 'Tab', '?', 'q'])
  })
})