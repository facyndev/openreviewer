/** File sidebar: status badges, file icons, diff stats, filter input, and selection highlight (REQ-6). */

import { Box, Text } from 'ink'
import type { ComponentRef, JSX, RefObject } from 'react'
import type { FileDiff, FileStatus } from '../services/git/index.js'
import { theme } from './theme.js'
import { windowOf } from './viewport.js'

const BADGE: Record<FileStatus, { label: string; color: string }> = {
  added: { label: 'A', color: theme.added },
  modified: { label: 'M', color: theme.modified },
  deleted: { label: 'D', color: theme.removed },
  renamed: { label: 'R', color: theme.info },
  binary: { label: 'B', color: theme.info },
  unknown: { label: '?', color: theme.textFaint },
}

function getFileStats(file: FileDiff): { additions: number; deletions: number } {
  let additions = 0
  let deletions = 0
  for (const hunk of file.hunks) {
    for (const line of hunk.lines) {
      if (line.kind === 'added') additions++
      if (line.kind === 'removed') deletions++
    }
  }
  return { additions, deletions }
}

export function FileTree({
  files,
  selected,
  focused,
  scrollRef,
  offset,
  visibleRows,
}: {
  files: FileDiff[]
  selected: number
  focused: boolean
  scrollRef?: RefObject<ComponentRef<typeof Box> | null>
  offset: number
  visibleRows: number
}): JSX.Element {
  const label = (file: FileDiff): string => file.newPath || file.oldPath || '(unknown)'
  const visible = windowOf(files, offset, visibleRows)
  const lines = Math.max(1, visibleRows)
  const clipped = files.length > lines
  const rangeEnd = Math.min(files.length, offset + lines)

  return (
    <Box
      flexDirection="column"
      width={36}
      borderStyle="round"
      borderColor={focused ? theme.borderActive : theme.borderSubtle}
      paddingX={1}
      overflow="hidden"
    >
      {/* Top Header: FILES CHANGED + count badge + scroll range + collapse icon */}
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <Box flexDirection="row">
          <Text bold color={theme.text}>
            FILES CHANGED{' '}
          </Text>
          <Text bold color={theme.accent}>
            {files.length}
          </Text>
        </Box>
        <Box flexDirection="row">
          {clipped && files.length > 0 && (
            <Text color={theme.textMuted}>
              {offset + 1}–{rangeEnd}/{files.length}{' '}
            </Text>
          )}
          <Text color={theme.textMuted}>v</Text>
        </Box>
      </Box>

      {/* Filter input */}
      <Box
        borderStyle="single"
        borderColor={theme.borderSubtle}
        paddingX={1}
        marginBottom={1}
      >
        <Text color={theme.textMuted}>/ Filter files</Text>
      </Box>

      {/* File List — clipped to the measured viewport, scrollable via treeOffset */}
      <Box flexDirection="column" flexGrow={1} ref={scrollRef}>
        {files.length === 0 ? (
          <Text color={theme.textMuted}>no changes</Text>
        ) : (
          visible.map((file, i) => {
            const fileIndex = offset + i
            const badge = BADGE[file.status]
            const isSelected = fileIndex === selected
            const stats = getFileStats(file)
            const filePath = label(file)

            return (
              <Box
                key={`${file.oldPath}\u0000${file.newPath}`}
                flexDirection="row"
                justifyContent="space-between"
              >
                <Box flexDirection="row" flexShrink={1}>
                  <Text color={isSelected ? theme.accent : theme.textFaint}>
                    {isSelected ? '▶ ' : '  '}
                  </Text>
                  <Text bold color={badge.color}>
                    {badge.label}{' '}
                  </Text>
                  <Text
                    wrap="truncate-end"
                    bold={isSelected}
                    color={isSelected ? theme.accent : theme.text}
                  >
                    {filePath}
                  </Text>
                </Box>

                {(stats.additions > 0 || stats.deletions > 0) && (
                  <Box flexDirection="row" flexShrink={0} marginLeft={1}>
                    {stats.additions > 0 && (
                      <Text color={theme.added}>+{stats.additions} </Text>
                    )}
                    {stats.deletions > 0 && (
                      <Text color={theme.removed}>-{stats.deletions}</Text>
                    )}
                  </Box>
                )}
              </Box>
            )
          })
        )}
      </Box>

      {/* Footer Info: File count + tree view mode label */}
      <Box
        flexDirection="row"
        justifyContent="space-between"
        borderStyle="single"
        borderColor={theme.borderSubtle}
        paddingX={1}
        marginTop={1}
      >
        <Text color={theme.textMuted}>
          {files.length} {files.length === 1 ? 'file' : 'files'} ({selected + 1})
        </Text>
        <Text color={theme.textMuted}>Tree</Text>
      </Box>
    </Box>
  )
}