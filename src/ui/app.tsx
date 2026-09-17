/** Root TUI shell (D3: Ink useReducer; REQ-8): header, sidebar + diff content row, status bar, help modal, clipped scrollable panes. */

import { useEffect, useReducer } from 'react'
import type { ComponentRef, JSX } from 'react'
import { Box, Text, useApp, useInput, useWindowSize } from 'ink'
import type { FileDiff, ReviewComment } from '../git/types.js'
import type { Action, Pane, ViewMode } from './keymap.js'
import { mapKey } from './keymap.js'
import { DiffView } from './diffview.js'
import { FileTree } from './filetree.js'
import { HelpPanel } from './helppanel.js'
import { StatusBar } from './statusbar.js'
import { theme } from './theme.js'
import { clampOffset, flattenDiffRows, followSelection, pageSize, scrollLines } from './viewport.js'

export interface AppState {
  files: FileDiff[]
  pane: Pane
  viewMode: ViewMode
  selectedFile: number
  showHelp: boolean
  comments: ReviewComment[]
  treeOffset: number
  diffOffset: number
  hOffset: number
  treeVisibleRows: number
  diffVisibleRows: number
  diffVisibleCols: number
}

/** Box DOM node type used by the scroll-container refs. */
export type BoxNode = ComponentRef<typeof Box>

/** Fixed chrome outside the tree list: header (3) + status bar (3). */
const APP_CHROME = 6
/** Fixed chrome inside the tree pane: border, title, filter, footer. */
const TREE_CHROME = 12
/** Fixed chrome inside the diff pane: border, file header, scroll indicator. */
const DIFF_CHROME = 5
/** Fixed chrome left of the diff gutter: tree width + diff border + padding + gutter. */
const SIDE_CHROME = 36 + 2 + 2 + 12

const DEFAULT_TREE_ROWS = Math.max(1, 24 - APP_CHROME - TREE_CHROME)
const DEFAULT_DIFF_ROWS = Math.max(1, 24 - APP_CHROME - DIFF_CHROME)
const DEFAULT_DIFF_COLS = Math.max(1, 80 - SIDE_CHROME)

export function createInitialState(
  files: FileDiff[],
  initialComments: ReviewComment[] = [],
  initialViewMode: ViewMode = 'side-by-side',
): AppState {
  return {
    files,
    pane: 'tree',
    viewMode: initialViewMode,
    selectedFile: 0,
    showHelp: false,
    comments: initialComments,
    treeOffset: 0,
    diffOffset: 0,
    hOffset: 0,
    treeVisibleRows: DEFAULT_TREE_ROWS,
    diffVisibleRows: DEFAULT_DIFF_ROWS,
    diffVisibleCols: DEFAULT_DIFF_COLS,
  }
}

function totalRowsOf(files: readonly FileDiff[], index: number, viewMode: ViewMode = 'side-by-side'): number {
  const file = files[index]
  return file ? flattenDiffRows(file, viewMode).length : 0
}

function clampSelection(selected: number, total: number): number {
  return Math.min(Math.max(selected, 0), Math.max(0, total - 1))
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.kind) {
    case 'move_down':
      if (state.pane === 'tree') {
        return {
          ...state,
          selectedFile: clampSelection(state.selectedFile + 1, state.files.length),
          treeOffset: followSelection(
            state.treeOffset,
            clampSelection(state.selectedFile + 1, state.files.length),
            state.treeVisibleRows,
            state.files.length,
          ),
          diffOffset: 0,
        }
      }
      return {
        ...state,
        diffOffset: scrollLines(
          state.diffOffset,
          1,
          totalRowsOf(state.files, state.selectedFile, state.viewMode),
          state.diffVisibleRows,
        ),
      }
    case 'move_up':
      if (state.pane === 'tree') {
        return {
          ...state,
          selectedFile: clampSelection(state.selectedFile - 1, state.files.length),
          treeOffset: followSelection(
            state.treeOffset,
            clampSelection(state.selectedFile - 1, state.files.length),
            state.treeVisibleRows,
            state.files.length,
          ),
          diffOffset: 0,
        }
      }
      return {
        ...state,
        diffOffset: scrollLines(
          state.diffOffset,
          -1,
          totalRowsOf(state.files, state.selectedFile, state.viewMode),
          state.diffVisibleRows,
        ),
      }
    case 'scroll_line_down':
      if (state.pane === 'tree') {
        return {
          ...state,
          selectedFile: clampSelection(state.selectedFile + 1, state.files.length),
          treeOffset: followSelection(
            state.treeOffset,
            clampSelection(state.selectedFile + 1, state.files.length),
            state.treeVisibleRows,
            state.files.length,
          ),
          diffOffset: 0,
        }
      }
      return {
        ...state,
        diffOffset: scrollLines(
          state.diffOffset,
          1,
          totalRowsOf(state.files, state.selectedFile, state.viewMode),
          state.diffVisibleRows,
        ),
      }
    case 'scroll_line_up':
      if (state.pane === 'tree') {
        return {
          ...state,
          selectedFile: clampSelection(state.selectedFile - 1, state.files.length),
          treeOffset: followSelection(
            state.treeOffset,
            clampSelection(state.selectedFile - 1, state.files.length),
            state.treeVisibleRows,
            state.files.length,
          ),
          diffOffset: 0,
        }
      }
      return {
        ...state,
        diffOffset: scrollLines(
          state.diffOffset,
          -1,
          totalRowsOf(state.files, state.selectedFile, state.viewMode),
          state.diffVisibleRows,
        ),
      }
    case 'scroll_page_down':
      if (state.pane === 'tree') {
        const next = clampSelection(
          state.selectedFile + pageSize(state.treeVisibleRows),
          state.files.length,
        )
        return {
          ...state,
          selectedFile: next,
          treeOffset: followSelection(
            state.treeOffset,
            next,
            state.treeVisibleRows,
            state.files.length,
          ),
          diffOffset: 0,
        }
      }
      return {
        ...state,
        diffOffset: scrollLines(
          state.diffOffset,
          pageSize(state.diffVisibleRows),
          totalRowsOf(state.files, state.selectedFile, state.viewMode),
          state.diffVisibleRows,
        ),
      }
    case 'scroll_page_up':
      if (state.pane === 'tree') {
        const prev = clampSelection(
          state.selectedFile - pageSize(state.treeVisibleRows),
          state.files.length,
        )
        return {
          ...state,
          selectedFile: prev,
          treeOffset: followSelection(
            state.treeOffset,
            prev,
            state.treeVisibleRows,
            state.files.length,
          ),
          diffOffset: 0,
        }
      }
      return {
        ...state,
        diffOffset: scrollLines(
          state.diffOffset,
          -pageSize(state.diffVisibleRows),
          totalRowsOf(state.files, state.selectedFile, state.viewMode),
          state.diffVisibleRows,
        ),
      }
    case 'scroll_home':
      if (state.pane === 'tree') {
        return {
          ...state,
          selectedFile: 0,
          treeOffset: 0,
          diffOffset: 0,
        }
      }
      return {
        ...state,
        diffOffset: 0,
      }
    case 'scroll_end':
      if (state.pane === 'tree') {
        const last = Math.max(0, state.files.length - 1)
        return {
          ...state,
          selectedFile: last,
          treeOffset: clampOffset(state.files.length, state.files.length, state.treeVisibleRows),
          diffOffset: 0,
        }
      }
      return {
        ...state,
        diffOffset: scrollLines(
          state.diffOffset,
          Number.POSITIVE_INFINITY,
          totalRowsOf(state.files, state.selectedFile, state.viewMode),
          state.diffVisibleRows,
        ),
      }
    case 'scroll_left':
      if (state.pane === 'tree') return { ...state, pane: 'diff' }
      return { ...state, hOffset: Math.max(0, state.hOffset - hScrollStep(state.diffVisibleCols)) }
    case 'scroll_right':
      if (state.pane === 'tree') return { ...state, pane: 'diff' }
      return { ...state, hOffset: state.hOffset + hScrollStep(state.diffVisibleCols) }
    case 'switch_pane':
      return { ...state, pane: state.pane === 'tree' ? 'diff' : 'tree' }
    case 'open_file':
      return state.files.length > 0
        ? { ...state, pane: 'diff', diffOffset: 0, hOffset: 0 }
        : state
    case 'toggle_mode':
      return {
        ...state,
        viewMode: state.viewMode === 'unified' ? 'side-by-side' : 'unified',
        diffOffset: 0,
        hOffset: 0,
      }
    case 'toggle_help':
      return { ...state, showHelp: !state.showHelp }
    case 'quit':
      return state
    case 'set_viewport':
      if (
        state.treeVisibleRows === action.treeVisibleRows &&
        state.diffVisibleRows === action.diffVisibleRows &&
        state.diffVisibleCols === action.diffVisibleCols
      ) {
        return state
      }
      return {
        ...state,
        treeVisibleRows: action.treeVisibleRows,
        diffVisibleRows: action.diffVisibleRows,
        diffVisibleCols: action.diffVisibleCols,
        treeOffset: clampOffset(state.treeOffset, state.files.length, action.treeVisibleRows),
        diffOffset: clampOffset(
          state.diffOffset,
          totalRowsOf(state.files, state.selectedFile, state.viewMode),
          action.diffVisibleRows,
        ),
      }
    default:
      return state
  }
}

function hScrollStep(visibleCols: number): number {
  return Math.max(1, Math.floor(Math.max(1, visibleCols) / 2))
}

function Header({
  viewMode,
  fileCount,
}: {
  viewMode: ViewMode
  fileCount: number
}): JSX.Element {
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="round"
      borderColor={theme.borderSubtle}
    >
      <Text bold color={theme.accent}>
        openreviewer
      </Text>
      <Text color={theme.textMuted}>
        {viewMode} · {fileCount} {fileCount === 1 ? 'file' : 'files'}
      </Text>
    </Box>
  )
}

/** Dimension fallback for a not-yet-measured pane: window dimension minus fixed chrome. */
function fallbackDimension(windowDimension: number, chrome: number, fallback: number = 24): number {
  if (Number.isFinite(windowDimension) && windowDimension > 0) return Math.max(1, windowDimension - chrome)
  return Math.max(1, fallback - chrome)
}

export function App({
  files,
  initialComments = [],
  initialViewMode = 'side-by-side',
}: {
  files: FileDiff[]
  initialComments?: ReviewComment[]
  initialViewMode?: ViewMode
}): JSX.Element {
  const [state, dispatch] = useReducer(
    reducer,
    files,
    (f) => createInitialState(f, initialComments, initialViewMode),
  )
  const { exit } = useApp()
  const { columns, rows } = useWindowSize()
  const hasSize = Number.isFinite(columns) && Number.isFinite(rows) && columns > 0 && rows > 0
  const windowRows = Number.isFinite(rows) && rows > 0 ? rows : 0
  const windowCols = Number.isFinite(columns) && columns > 0 ? columns : 0

  const treeVisibleRows = fallbackDimension(windowRows, APP_CHROME + TREE_CHROME, 24)
  const diffVisibleRows = fallbackDimension(windowRows, APP_CHROME + DIFF_CHROME, 24)
  const diffVisibleCols = fallbackDimension(windowCols, SIDE_CHROME, 80)

  useEffect(() => {
    if (!hasSize) return
    dispatch({
      kind: 'set_viewport',
      treeVisibleRows,
      diffVisibleRows,
      diffVisibleCols,
    })
  }, [hasSize, treeVisibleRows, diffVisibleRows, diffVisibleCols])

  useInput(
    (input, key) => {
      const action = mapKey(input, {
        upArrow: key.upArrow,
        downArrow: key.downArrow,
        leftArrow: key.leftArrow,
        rightArrow: key.rightArrow,
        pageUp: key.pageUp,
        pageDown: key.pageDown,
        ctrl: key.ctrl,
        shift: key.shift,
        tab: key.tab,
        return: key.return,
      })
      if (!action) return
      if (action.kind === 'quit') {
        exit()
        return
      }
      if (state.showHelp && action.kind !== 'toggle_help') return
      dispatch(action)
    },
    { isActive: true },
  )

  const selected = state.files[state.selectedFile]
  const diffFocused = state.pane === 'diff'
  const diffTotal = selected ? flattenDiffRows(selected, state.viewMode).length : 0
  const scrollLabel =
    state.pane === 'tree'
      ? state.files.length > 0
        ? `${state.treeOffset + 1}–${Math.min(state.files.length, state.treeOffset + Math.max(1, state.treeVisibleRows))}/${state.files.length}`
        : undefined
      : diffTotal > 0
        ? `${state.diffOffset + 1}–${Math.min(diffTotal, state.diffOffset + Math.max(1, state.diffVisibleRows))}/${diffTotal}`
        : undefined

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      width={hasSize ? columns : undefined}
      height={hasSize ? rows : undefined}
    >
      <Header viewMode={state.viewMode} fileCount={state.files.length} />
      {state.showHelp ? (
        <Box flexGrow={1} alignItems="center" justifyContent="center">
          <HelpPanel />
        </Box>
      ) : (
        <Box flexDirection="row" flexGrow={1}>
          <FileTree
            files={state.files}
            selected={state.selectedFile}
            focused={state.pane === 'tree'}
            offset={state.treeOffset}
            visibleRows={state.treeVisibleRows}
          />
          <Box
            borderStyle="round"
            borderColor={theme.borderSubtle}
            flexGrow={1}
            overflow="hidden"
          >
            {selected ? (
              <DiffView
                file={selected}
                focused={diffFocused}
                comments={state.comments}
                viewMode={state.viewMode}
                diffOffset={state.diffOffset}
                hOffset={state.hOffset}
                visibleRows={state.diffVisibleRows}
                visibleCols={state.diffVisibleCols}
              />
            ) : (
              <Text color={theme.textMuted}>select a file to view its diff</Text>
            )}
          </Box>
        </Box>
      )}
      <StatusBar
        pane={state.pane}
        viewMode={state.viewMode}
        fileCount={state.files.length}
        selectedFile={state.pane === 'tree' ? state.selectedFile : undefined}
        scroll={scrollLabel}
      />
    </Box>
  )
}