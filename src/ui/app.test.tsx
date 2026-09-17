import { cleanup, render } from 'ink-testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import type { FileDiff } from '../services/git/index.js'
import { App, createInitialState, reducer, type AppState } from './app.js'

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
    expect(s.viewMode).toBe('side-by-side')
    s = reducer(s, { kind: 'toggle_mode' })
    expect(s.viewMode).toBe('unified')
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
    expect(s.pane).toBe('diff')
  })

  it('preserves selected file by newPath on reload_diff', () => {
    let s = createInitialState(files)
    s = reducer(s, { kind: 'move_down' })
    expect(s.selectedFile).toBe(1)
    expect(s.files[s.selectedFile]?.newPath).toBe('a.ts')

    const reordered: FileDiff[] = [
      file({ status: 'modified', newPath: 'a.ts' }),
      file({ status: 'added', newPath: 'new.ts' }),
    ]
    s = reducer(s, {
      kind: 'reload_diff',
      files: reordered,
      branch: 'feat/live',
      commitHash: 'abcdef1',
    })
    expect(s.selectedFile).toBe(0)
    expect(s.files[s.selectedFile]?.newPath).toBe('a.ts')
    expect(s.branch).toBe('feat/live')
    expect(s.commitHash).toBe('abcdef1')
  })

  it('clamps selection if selected file was removed on reload_diff', () => {
    let s = createInitialState(files)
    s = reducer(s, { kind: 'move_down' })
    s = reducer(s, { kind: 'move_down' })
    expect(s.selectedFile).toBe(2)

    const single: FileDiff[] = [file({ status: 'added', newPath: 'new.ts' })]
    s = reducer(s, { kind: 'reload_diff', files: single })
    expect(s.selectedFile).toBe(0)
  })
})

describe('reducer viewport scrolling (REQ-9)', () => {
  const diffFile: FileDiff = {
    status: 'modified',
    oldPath: 'big.ts',
    newPath: 'big.ts',
    hunks: [
      {
        header: '@@ -1,5 +1,5 @@',
        oldStart: 1,
        oldLines: 5,
        newStart: 1,
        newLines: 5,
        lines: [
          { kind: 'context', text: ' L1', oldNo: 1, newNo: 1 },
          { kind: 'context', text: ' L2', oldNo: 2, newNo: 2 },
          { kind: 'context', text: ' L3', oldNo: 3, newNo: 3 },
          { kind: 'context', text: ' L4', oldNo: 4, newNo: 4 },
          { kind: 'context', text: ' L5', oldNo: 5, newNo: 5 },
        ],
      },
    ],
  }

  it('starts all scroll offsets at zero', () => {
    const s = createInitialState(files)
    expect(s.treeOffset).toBe(0)
    expect(s.diffOffset).toBe(0)
    expect(s.hOffset).toBe(0)
  })

  it('scrolls the tree and follows the selection into view', () => {
    let s = { ...createInitialState(files), treeVisibleRows: 2 }
    s = reducer(s, { kind: 'scroll_line_down' })
    expect(s.selectedFile).toBe(1)
    expect(s.treeOffset).toBe(0)
    s = reducer(s, { kind: 'scroll_line_down' })
    expect(s.selectedFile).toBe(2)
    expect(s.treeOffset).toBe(1)
    s = reducer(s, { kind: 'scroll_line_up' })
    expect(s.selectedFile).toBe(1)
    expect(s.treeOffset).toBe(1)
    s = reducer(s, { kind: 'scroll_line_up' })
    expect(s.selectedFile).toBe(0)
    expect(s.treeOffset).toBe(0)
  })

  it('scrolls the diff by line within bounds', () => {
    let s: AppState = { ...createInitialState([diffFile]), pane: 'diff', diffVisibleRows: 2 }
    s = reducer(s, { kind: 'scroll_line_down' })
    expect(s.diffOffset).toBe(1)
    s = reducer(s, { kind: 'scroll_line_down' })
    s = reducer(s, { kind: 'scroll_line_down' })
    s = reducer(s, { kind: 'scroll_line_down' })
    s = reducer(s, { kind: 'scroll_line_down' })
    expect(s.diffOffset).toBe(4)
    s = reducer(s, { kind: 'scroll_line_up' })
    expect(s.diffOffset).toBe(3)
  })

  it('scrolls by page keeping overlap', () => {
    let s: AppState = { ...createInitialState([diffFile]), pane: 'diff', diffVisibleRows: 3 }
    s = reducer(s, { kind: 'scroll_page_down' })
    expect(s.diffOffset).toBe(2)
    s = reducer(s, { kind: 'scroll_page_down' })
    expect(s.diffOffset).toBe(3)
    s = reducer(s, { kind: 'scroll_page_up' })
    expect(s.diffOffset).toBe(1)
  })

  it('jumps to home and end', () => {
    let s: AppState = { ...createInitialState([diffFile]), pane: 'diff', diffVisibleRows: 2 }
    s = reducer(s, { kind: 'scroll_end' })
    expect(s.diffOffset).toBe(4)
    s = reducer(s, { kind: 'scroll_home' })
    expect(s.diffOffset).toBe(0)
  })

  it('resets diff scroll when selecting a new file', () => {
    let s: AppState = { ...createInitialState(files), treeVisibleRows: 2, diffOffset: 3 }
    s = reducer(s, { kind: 'move_down' })
    expect(s.selectedFile).toBe(1)
    expect(s.diffOffset).toBe(0)
  })

  it('scrolls horizontally in the diff pane', () => {
    let s: AppState = { ...createInitialState([diffFile]), pane: 'diff', diffVisibleCols: 20 }
    s = reducer(s, { kind: 'scroll_right' })
    expect(s.hOffset).toBe(10)
    s = reducer(s, { kind: 'scroll_right' })
    expect(s.hOffset).toBe(20)
    s = reducer(s, { kind: 'scroll_left' })
    expect(s.hOffset).toBe(10)
    s = reducer(s, { kind: 'scroll_left' })
    expect(s.hOffset).toBe(0)
    s = reducer(s, { kind: 'scroll_left' })
    expect(s.hOffset).toBe(0)
  })

  it('switches to diff on scroll_right from tree', () => {
    let s: AppState = createInitialState(files)
    expect(s.pane).toBe('tree')
    s = reducer(s, { kind: 'scroll_right' })
    expect(s.pane).toBe('diff')
    expect(s.hOffset).toBe(0)
    s = reducer(s, { kind: 'switch_pane' })
    expect(s.pane).toBe('tree')
    s = reducer(s, { kind: 'scroll_left' })
    expect(s.pane).toBe('diff')
  })

  it('resets scroll when switching view mode or opening file', () => {
    let s: AppState = { ...createInitialState([diffFile]), pane: 'tree', diffOffset: 3, hOffset: 5 }
    s = reducer(s, { kind: 'open_file' })
    expect(s.pane).toBe('diff')
    expect(s.diffOffset).toBe(0)
    expect(s.hOffset).toBe(0)

    s = { ...createInitialState([diffFile]), pane: 'diff', diffOffset: 3 }
    s = reducer(s, { kind: 'toggle_mode' })
    expect(s.diffOffset).toBe(0)
  })

  it('clamps offsets when viewport shrinks (REQ-9 resize clamp)', () => {
    let s: AppState = { ...createInitialState([diffFile]), pane: 'diff', diffVisibleRows: 2, diffOffset: 4 }
    s = reducer(s, {
      kind: 'set_viewport',
      treeVisibleRows: 2,
      diffVisibleRows: 5,
      diffVisibleCols: 40,
    })
    expect(s.diffOffset).toBe(1)
  })

  it('no-ops on identical viewport measurements', () => {
    const s: AppState = createInitialState([diffFile])
    const next = reducer(s, {
      kind: 'set_viewport',
      treeVisibleRows: s.treeVisibleRows,
      diffVisibleRows: s.diffVisibleRows,
      diffVisibleCols: s.diffVisibleCols,
    })
    expect(next).toBe(s)
  })

  it('initializes in unified mode when requested', () => {
    const s: AppState = { ...createInitialState([diffFile], [], 'unified'), pane: 'diff', diffVisibleRows: 2 }
    expect(s.viewMode).toBe('unified')
  })
})

describe('App rendering', () => {
  it('renders all three regions without crashing', () => {
    const { lastFrame } = render(<App files={files} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('openreviewer')
    expect(frame).toContain('FILES CHANGED')
    expect(frame).toContain('NORMAL')
  })

  it('renders dynamic branch and commit hash in the status bar', () => {
    const { lastFrame } = render(
      <App files={files} branch="feature/review" commitHash="c072ea4" />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('feature/review (c072ea4)')
  })

  it('toggles the help overlay on ? keypress and hides other chrome', async () => {
    const instance = render(<App files={files} />)
    await tick()
    expect(instance.lastFrame() ?? '').not.toContain('openreviewer — key bindings')

    instance.stdin.write('?')
    await tick()
    const frame = instance.lastFrame() ?? ''
    expect(frame).toContain('openreviewer — key bindings')
    expect(frame).toContain('openreviewer')
    expect(frame).toContain('? closes this panel')
  })

  it('handles q without crashing and unmounts cleanly', async () => {
    const instance = render(<App files={files} />)
    await tick()
    instance.stdin.write('q')
    await tick()
    instance.unmount()
  })

  it('does not render any comment card by default when no comments are present', () => {
    const { lastFrame } = render(<App files={files} />)
    const frame = lastFrame() ?? ''
    expect(frame).not.toContain('Pending comment')
    expect(frame).not.toContain('alex-dev')
  })

  it('renders dynamic comments passed via initialComments', () => {
    const sampleComment = {
      id: 'c1',
      filePath: 'new.ts',
      author: 'carla-reviewer',
      timeAgo: '2m ago',
      status: 'pending' as const,
      text: 'Consider adding error handling here.',
    }
    const { lastFrame } = render(
      <App files={files} initialComments={[sampleComment]} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('carla-reviewer')
    expect(frame).toContain('Consider adding error handling here.')
    expect(frame).toContain('Pending comment')
  })

  it('renders side-by-side view with left removed and right added columns aligned', async () => {
    const diffFiles: FileDiff[] = [
      {
        status: 'modified',
        oldPath: 'calc.ts',
        newPath: 'calc.ts',
        hunks: [
          {
            header: '@@ -1,3 +1,3 @@',
            oldStart: 1,
            oldLines: 3,
            newStart: 1,
            newLines: 3,
            lines: [
              { kind: 'context', text: ' baseLine', oldNo: 1, newNo: 1 },
              { kind: 'removed', text: '-oldResult', oldNo: 2 },
              { kind: 'added', text: '+newResult', newNo: 2 },
              { kind: 'context', text: ' endLine', oldNo: 3, newNo: 3 },
            ],
          },
        ],
      },
      ...files,
    ]

    const instance = render(<App files={diffFiles} />)
    await tick()
    const frame = instance.lastFrame() ?? ''
    expect(frame).toContain('Original (-)')
    expect(frame).toContain('Modified (+)')
    expect(frame).toContain('oldRes')
    expect(frame).toContain('newRes')
    expect(frame).toContain('│')
    instance.unmount()
  })
})

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10))
}