/** Bottom status bar: view mode, selection, and key hints. */

import { Text } from 'ink'
import type { JSX } from 'react'
import type { Pane, ViewMode } from './keymap.js'
import { KEY_HINTS } from './keymap.js'

export function StatusBar({
  pane,
  viewMode,
  fileCount,
  selectedFile,
}: {
  pane: Pane
  viewMode: ViewMode
  fileCount: number
  selectedFile?: number
}): JSX.Element {
  const position = selectedFile !== undefined ? `${selectedFile + 1}/${fileCount}` : ''
  const hints = KEY_HINTS.map(([key, label]) => `${key} ${label}`).join(' · ')
  return (
    <Text>
      <Text bold>openreviewer</Text>
      <Text dimColor>
        {' '}
        {pane} {viewMode} {position} | {hints}
      </Text>
    </Text>
  )
}