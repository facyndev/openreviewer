/** Bottom status bar: mode badge, progress bar, navigation hints, and git/encoding info (AGENTS.md). */

import { Box, Text } from 'ink'
import type { JSX } from 'react'
import type { Pane, ViewMode } from './keymap.js'
import { theme } from './theme.js'

export function StatusBar({
  pane,
  viewMode,
  fileCount,
  selectedFile,
  branch,
  commitHash,
  scroll,
}: {
  pane: Pane
  viewMode: ViewMode
  fileCount: number
  selectedFile?: number
  branch?: string
  commitHash?: string
  scroll?: string
}): JSX.Element {
  const currentIndex = selectedFile !== undefined ? selectedFile + 1 : fileCount > 0 ? 1 : 0
  const percent = fileCount > 0 ? Math.round((currentIndex / fileCount) * 100) : 100

  const totalBars = 10
  const filledBars = fileCount > 0 ? Math.min(totalBars, Math.max(1, Math.round((currentIndex / fileCount) * totalBars))) : 0
  const emptyBars = totalBars - filledBars
  const progressBar = '━'.repeat(filledBars) + '─'.repeat(emptyBars)

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="single"
      borderColor={theme.borderSubtle}
      height={3}
      flexShrink={0}
      overflow="hidden"
    >
      {/* Left side: NORMAL mode badge, view mode, file progress, visual progress bar */}
      <Box flexDirection="row" flexShrink={1} overflow="hidden">
        <Text bold color={theme.bg} backgroundColor={theme.accent}>
          {' NORMAL '}
        </Text>
        <Text> </Text>
        <Text color={theme.accent}>
          {pane}: {viewMode}
        </Text>
        <Text color={theme.textMuted}>
          {' '}
          {currentIndex}/{fileCount} files · {percent}%{' '}
        </Text>
        <Text color={theme.accent}>{progressBar}</Text>
        {scroll ? <Text color={theme.textMuted}> {scroll}</Text> : null}
      </Box>

      {/* Center: Navigation shortcuts matching screenshot */}
      <Box flexDirection="row" flexShrink={1} marginX={1} overflow="hidden">
        <Text wrap="truncate">
          <Text color={theme.accent}>j/k</Text>
          <Text color={theme.textMuted}> nav · </Text>
          <Text color={theme.accent}>Tab</Text>
          <Text color={theme.textMuted}> mode · </Text>
          <Text color={theme.accent}>?</Text>
          <Text color={theme.textMuted}> help</Text>
        </Text>
      </Box>

      {/* Right side: Encoding, Git branch / SHA, Quit */}
      <Box flexDirection="row" flexShrink={0}>
        <Text color={theme.textMuted}>UTF-8</Text>
        {branch || commitHash ? (
          <>
            <Text color={theme.textMuted}> | </Text>
            {branch && commitHash ? (
              <>
                <Text color={theme.accent}>{branch}</Text>
                <Text color={theme.textMuted}> (</Text>
                <Text color={theme.added}>{commitHash}</Text>
                <Text color={theme.textMuted}>)</Text>
              </>
            ) : branch ? (
              <Text color={theme.accent}>{branch}</Text>
            ) : (
              <Text color={theme.added}>{commitHash}</Text>
            )}
          </>
        ) : null}
        <Text color={theme.textMuted}> | </Text>
        <Text color={theme.accent}>q</Text>
        <Text color={theme.textMuted}> quit</Text>
      </Box>
    </Box>
  )
}