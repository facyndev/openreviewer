/** Application state reducer for the TUI (D3: Ink useReducer; REQ-8). */

import { useReducer } from 'react'
import type { JSX } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import type { FileDiff } from '../git/types.js'
import type { Action, Pane, ViewMode } from './keymap.js'
import { mapKey } from './keymap.js'
import { DiffView } from './diffview.js'
import { FileTree } from './filetree.js'
import { HelpPanel } from './helppanel.js'
import { StatusBar } from './statusbar.js'

export interface AppState {
  files: FileDiff[]
  pane: Pane
  viewMode: ViewMode
  selectedFile: number
  showHelp: boolean
}

export function createInitialState(files: FileDiff[]): AppState {
  return { files, pane: 'tree', viewMode: 'unified', selectedFile: 0, showHelp: false }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.kind) {
    case 'move_down':
      if (state.pane === 'tree') {
        return { ...state, selectedFile: Math.min(state.selectedFile + 1, Math.max(state.files.length - 1, 0)) }
      }
      return state
    case 'move_up':
      if (state.pane === 'tree') {
        return { ...state, selectedFile: Math.max(state.selectedFile - 1, 0) }
      }
      return state
    case 'switch_pane':
      return { ...state, pane: state.pane === 'tree' ? 'diff' : 'tree' }
    case 'open_file':
      return state.files.length > 0 ? { ...state, pane: 'diff' } : state
    case 'toggle_mode':
      return { ...state, viewMode: state.viewMode === 'unified' ? 'side-by-side' : 'unified' }
    case 'toggle_help':
      return { ...state, showHelp: !state.showHelp }
    case 'quit':
      return state
  }
}

export function App({ files }: { files: FileDiff[] }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, files, createInitialState)
  const { exit } = useApp()

  useInput(
    (input, key) => {
      const action = mapKey(input, {
        upArrow: key.upArrow,
        downArrow: key.downArrow,
        leftArrow: key.leftArrow,
        rightArrow: key.rightArrow,
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

  if (state.showHelp) {
    return <HelpPanel />
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" flexGrow={1}>
        <FileTree
          files={state.files}
          selected={state.selectedFile}
          focused={state.pane === 'tree'}
        />
        <Box borderStyle="round" borderColor={state.pane === 'diff' ? 'green' : 'gray'} flexGrow={1}>
          {selected ? <DiffView file={selected} focused={state.pane === 'diff'} /> : <Text dimColor>select a file to view its diff</Text>}
        </Box>
      </Box>
      <StatusBar
        pane={state.pane}
        viewMode={state.viewMode}
        fileCount={state.files.length}
        selectedFile={state.pane === 'tree' ? state.selectedFile : undefined}
      />
    </Box>
  )
}