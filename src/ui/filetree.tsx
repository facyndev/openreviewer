/** File tree navigator with change badges and empty state (REQ-6). */

import { Box, Text } from 'ink'
import type { JSX } from 'react'
import type { FileDiff, FileStatus } from '../git/types.js'

const BADGE: Record<FileStatus, { label: string; color: string }> = {
  added: { label: 'A', color: 'green' },
  modified: { label: 'M', color: 'yellow' },
  deleted: { label: 'D', color: 'red' },
  renamed: { label: 'R', color: 'cyan' },
  binary: { label: 'B', color: 'cyan' },
  unknown: { label: '?', color: 'gray' },
}

export function FileTree({
  files,
  selected,
  focused,
}: {
  files: FileDiff[]
  selected: number
  focused: boolean
}): JSX.Element {
  const label = (file: FileDiff): string => file.newPath || file.oldPath || '(unknown)'

  return (
    <Box flexDirection="column" width={40} borderStyle="round" borderColor={focused ? 'green' : 'gray'}>
      <Text bold>files</Text>
      {files.length === 0 ? (
        <Text dimColor>no changes</Text>
      ) : (
        files.map((file, i) => {
          const badge = BADGE[file.status]
          const isSelected = i === selected
          return (
            <Box key={`${file.oldPath}\u0000${file.newPath}`} flexDirection="row">
              <Text color={badge.color}>{badge.label}</Text>
              <Text wrap="truncate-end" inverse={isSelected && focused} bold={isSelected}>
                {isSelected ? ` ${label(file)}` : `  ${label(file)}`}
              </Text>
            </Box>
          )
        })
      )}
    </Box>
  )
}