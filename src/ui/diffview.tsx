/** Diff content viewer: row-aligned side-by-side or unified view (REQ-7). */

import { Box, Text } from 'ink'
import { useMemo } from 'react'
import type { ComponentRef, JSX, RefObject } from 'react'
import type { FileDiff, FileStatus, Line, ReviewComment } from '../git/types.js'
import { CommentCard } from './commentcard.js'
import type { ViewMode } from './keymap.js'
import { theme } from './theme.js'
import { flattenDiffRows, sliceColumns, windowOf } from './viewport.js'

/** Gutter columns (old/new numbers) plus the line sign prefix. */
const GUTTER_WIDTH = 4 + 1 + 4 + 1 + 2

function cleanText(text: string): string {
  if (text.startsWith('-') || text.startsWith('+') || text.startsWith(' ')) {
    return text.slice(1)
  }
  return text
}

function getFileType(filePath: string): string {
  if (filePath.endsWith('.md')) return 'Markdown Documentation'
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'TypeScript Source'
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'JavaScript Source'
  if (filePath.endsWith('.json')) return 'JSON Configuration'
  if (filePath.endsWith('.toml')) return 'TOML Configuration'
  if (filePath.endsWith('.go')) return 'Go Source'
  if (filePath.endsWith('.css')) return 'CSS Stylesheet'
  return 'Source File'
}

function getStatusLabel(status: FileStatus): string {
  switch (status) {
    case 'added':
      return 'Added'
    case 'modified':
      return 'Modified'
    case 'deleted':
      return 'Deleted'
    case 'renamed':
      return 'Renamed'
    case 'binary':
      return 'Binary'
    default:
      return 'Changed'
  }
}

function getStatusColor(status: FileStatus): string {
  switch (status) {
    case 'added':
      return theme.added
    case 'modified':
      return theme.modified
    case 'deleted':
      return theme.removed
    case 'renamed':
      return theme.info
    default:
      return theme.accent
  }
}

function formatGutter(line: Line): { oldStr: string; nextStr: string } {
  const oldStr = line.oldNo !== undefined ? String(line.oldNo).padStart(4) : '    '
  const nextStr = line.newNo !== undefined ? String(line.newNo).padStart(4) : '    '
  return { oldStr, nextStr }
}

export function DiffView({
  file,
  focused,
  comments = [],
  viewMode = 'side-by-side',
  scrollRef,
  diffOffset,
  hOffset,
  visibleRows,
  visibleCols,
}: {
  file: FileDiff
  focused: boolean
  comments?: ReviewComment[]
  viewMode?: ViewMode
  scrollRef?: RefObject<ComponentRef<typeof Box> | null>
  diffOffset: number
  hOffset: number
  visibleRows: number
  visibleCols: number
}): JSX.Element {
  const filePath = file.newPath || file.oldPath
  const statusLabel = getStatusLabel(file.status)
  const statusColor = getStatusColor(file.status)
  const fileType = getFileType(filePath)

  const fileComments = comments.filter((c) => c.filePath === filePath)

  if (file.hunks.length === 0) {
    return (
      <Box flexDirection="column" padding={1} overflow="hidden">
        <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <Box flexDirection="row">
            <Text color={theme.textMuted}>path: </Text>
            <Text bold color={focused ? theme.accent : theme.text}>
              {filePath}
            </Text>
            <Text> </Text>
            <Text bold color={theme.bg} backgroundColor={statusColor}>
              {` ${statusLabel} `}
            </Text>
            <Text color={theme.textMuted}> {fileType}</Text>
          </Box>
        </Box>
        <Text color={theme.textMuted}>no line changes (binary or rename)</Text>
        {fileComments.map((comment) => (
          <Box key={comment.id} flexShrink={0} marginY={1}>
            <CommentCard comment={comment} />
          </Box>
        ))}
      </Box>
    )
  }

  const rows = useMemo(() => flattenDiffRows(file, viewMode), [file, viewMode])
  const lines = Math.max(1, visibleRows)
  const codeCols = Math.max(1, visibleCols - GUTTER_WIDTH)
  const visible = windowOf(rows, diffOffset, lines)
  const clipped = rows.length > lines

  const maxLineLen = useMemo(
    () =>
      rows.reduce((max, row) => {
        if (row.type === 'hunk') return Math.max(max, row.text.length)
        if (row.type === 'side-by-side') {
          return Math.max(max, row.left.text.length, row.right.text.length)
        }
        return Math.max(max, row.line.text.length)
      }, 0),
    [rows],
  )
  const hiddenLeft = hOffset > 0
  const hiddenRight = maxLineLen > hOffset + codeCols
  const rangeStart = diffOffset + 1
  const rangeEnd = Math.min(rows.length, diffOffset + lines)

  const halfCols = Math.max(10, Math.floor((visibleCols - 1) / 2))
  const rightCols = Math.max(10, visibleCols - 1 - halfCols)
  const sideGutterWidth = 5 // 4 digits + 1 space
  const leftCodeCols = Math.max(1, halfCols - sideGutterWidth - 2)
  const rightCodeCols = Math.max(1, rightCols - sideGutterWidth - 2)

  const header = (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      borderStyle="single"
      borderColor={theme.borderSubtle}
      paddingX={1}
      marginBottom={1}
    >
      <Box flexDirection="row" flexShrink={1}>
        <Text color={theme.textMuted}>path: </Text>
        <Text bold color={focused ? theme.accent : theme.text}>
          {filePath}
        </Text>
        <Text> </Text>
        <Text bold color={theme.bg} backgroundColor={statusColor}>
          {` ${statusLabel} `}
        </Text>
      </Box>

      <Box flexDirection="row" flexShrink={0} marginLeft={1}>
        <Text color={theme.textMuted}>Jump: </Text>
        <Text bold color={theme.accent}>
          ]c [c
        </Text>
      </Box>
    </Box>
  )

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={0}>
      {header}

      {/* Side-by-side column labels */}
      {viewMode === 'side-by-side' && (
        <Box flexDirection="row" flexShrink={0} marginBottom={1}>
          <Text color={theme.textFaint}>{' '.repeat(sideGutterWidth)}</Text>
          <Text bold color={theme.removed}>
            {'Original (-)'.padEnd(Math.max(12, halfCols - sideGutterWidth))}
          </Text>
          <Text color={theme.borderSubtle}>│</Text>
          <Text color={theme.textFaint}>{' '.repeat(sideGutterWidth)}</Text>
          <Text bold color={theme.added}>
            {'Modified (+)'}
          </Text>
        </Box>
      )}

      {/* Scroll indicator: vertical range and hidden horizontal content */}
      {(clipped || hiddenLeft || hiddenRight) && (
        <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <Text color={theme.textMuted}>
            {clipped ? `lines ${rangeStart}–${rangeEnd}/${rows.length}` : ''}
          </Text>
          <Text color={theme.textMuted}>
            {hiddenLeft ? '◀ ' : ''}
            {hiddenRight ? '▶' : ''}
          </Text>
        </Box>
      )}

      {/* Diff rows — clipped to the measured viewport, scrollable on both axes */}
      <Box flexDirection="column" flexGrow={1} overflow="hidden" ref={scrollRef}>
        {visible.map((row, i) => {
          const absIndex = diffOffset + i
          if (row.type === 'hunk') {
            return (
              <Text key={absIndex} bold color={theme.accent}>
                {sliceColumns(row.text, hOffset, visibleCols)}
              </Text>
            )
          }

          if (row.type === 'side-by-side') {
            const leftNo = row.left.lineNo !== undefined ? String(row.left.lineNo).padStart(4) : '    '
            const rightNo = row.right.lineNo !== undefined ? String(row.right.lineNo).padStart(4) : '    '

            const leftPrefix = row.left.kind === 'removed' ? '- ' : '  '
            const rightPrefix = row.right.kind === 'added' ? '+ ' : '  '

            const leftColor = row.left.kind === 'removed' ? theme.removed : theme.text
            const rightColor = row.right.kind === 'added' ? theme.added : theme.text

            const leftClean = cleanText(row.left.text)
            const rightClean = cleanText(row.right.text)

            const leftBody = sliceColumns(leftClean, hOffset, leftCodeCols)
            const rightBody = sliceColumns(rightClean, hOffset, rightCodeCols)

            const leftContent = (leftPrefix + leftBody).padEnd(Math.max(2, halfCols - sideGutterWidth))

            return (
              <Box key={absIndex} flexDirection="row">
                {/* Left side: changes that leave (old / removed) */}
                <Text color={theme.textFaint}>{leftNo} </Text>
                <Text bold={row.left.kind === 'removed'} color={leftColor}>
                  {leftContent}
                </Text>

                {/* Column divider */}
                <Text color={theme.borderSubtle}>│</Text>

                {/* Right side: changes that are new (added) */}
                <Text color={theme.textFaint}>{rightNo} </Text>
                <Text bold={row.right.kind === 'added'} color={rightColor} wrap="truncate">
                  {rightPrefix}
                  {rightBody}
                </Text>
              </Box>
            )
          }

          // Unified diff row fallback
          const { oldStr, nextStr } = formatGutter(row.line)
          const prefix = row.added ? '+ ' : row.removed ? '- ' : '  '
          const textColor = row.added ? theme.added : row.removed ? theme.removed : theme.text
          const body = cleanText(row.line.text)

          return (
            <Box key={absIndex} flexDirection="row">
              {/* Gutter columns — fixed, never scroll horizontally */}
              <Text color={theme.textFaint}>{oldStr} </Text>
              <Text color={theme.textFaint}>{nextStr} </Text>
              {/* Sign & line text, windowed horizontally, never wrapped */}
              <Text bold={row.added || row.removed} color={textColor} wrap="truncate">
                {prefix}
                {sliceColumns(body, hOffset, codeCols)}
              </Text>
            </Box>
          )
        })}
      </Box>

      {/* Real review comments for this file */}
      {fileComments.map((comment) => (
        <Box key={comment.id} flexShrink={0} marginY={1}>
          <CommentCard comment={comment} />
        </Box>
      ))}
    </Box>
  )
}