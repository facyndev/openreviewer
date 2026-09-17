import { cleanup, render } from 'ink-testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import type { FileDiff } from '../git/types.js'
import { App, createInitialState, reducer } from './app.js'

function file(diff: Partial<FileDiff> = {}): FileDiff {
  return {
    status: 'modified',
    oldPath: 'a.txt',
    newPath: 'a.txt',
    hunks: [],
    ...diff,
  }
}

const files: FileDiff[] = [
  file({ status: 'added', newPath: 'new.ts' }),
  file({ status: 'modified', newPath: 'a.ts' }),
  file({ oldPath: 'gone.ts', newPath: 'gone.ts', status: 'deleted' }),
]

afterEach(() => cleanup())

describe('reducer (REQ-8 state)', () => {
  it('moves selection down and clamps at the last file', () => {
    let s = createInitialState(files)
    s = reducer(s, { kind: 'move_down' })
    expect(s.selectedFile).toBe(1)
    s = reducer(s, { kind: 'move_down' })
    s = reducer(s, { kind: 'move_down' })
    expect(s.selectedFile).toBe(2)
  })

  it('clamps selection up at zero', () => {
    let s = createInitialState(files)
    s = reducer(s, { kind: 'move_up' })
    expect(s.selectedFile).toBe(0)
  })

  it('switches pane and opens a file', () => {
    let s = createInitialState(files)
    s = reducer(s, { kind: 'open_file' })
    expect(s.pane).toBe('diff')
    s = reducer(s, { kind: 'switch_pane' })
    expect(s.pane).toBe('tree')
  })

  it('toggles view mode and help', () => {
    let s = createInitialState(files)
    s = reducer(s, { kind: 'toggle_mode' })
    expect(s.viewMode).toBe('side-by-side')
    s = reducer(s, { kind: 'toggle_help' })
    expect(s.showHelp).toBe(true)
  })

  it('is safe with an empty file list', () => {
    let s = createInitialState([])
    s = reducer(s, { kind: 'move_down' })
    s = reducer(s, { kind: 'open_file' })
    expect(s.selectedFile).toBe(0)
    expect(s.pane).toBe('tree')
    s = reducer(s, { kind: 'switch_pane' })
    expect(s.pane).toBe('diff') // panes still toggle; nothing to crash on
  })
})

describe('App rendering', () => {
  it('shows file badges and names', () => {
    const { lastFrame } = render(<App files={files} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('A')
    expect(frame).toContain('M')
    expect(frame).toContain('D')
    expect(frame).toContain('new.ts')
  })

  it('renders the empty state when there are no changes', () => {
    const { lastFrame } = render(<App files={[]} />)
    expect(lastFrame() ?? '').toContain('no changes')
  })

  it('opens the help overlay on ? and closes it again', async () => {
    const instance = render(<App files={files} />)
    await tick()
    instance.stdin.write('?')
    await tick()
    expect(instance.lastFrame() ?? '').toContain('key bindings')
    instance.stdin.write('?')
    await tick()
    expect(instance.lastFrame() ?? '').not.toContain('key bindings')
  })

  it('handles q without crashing and unmounts cleanly', async () => {
    const instance = render(<App files={files} />)
    await tick()
    instance.stdin.write('q')
    await tick()
    instance.unmount()
  })
})

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10))
}