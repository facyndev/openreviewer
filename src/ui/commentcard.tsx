/** Inline code review comment card component driven by ReviewComment data. */

import type { JSX } from 'react'
import { Box, Text } from 'ink'
import type { ReviewComment } from '../services/git/index.js'
import { theme } from './theme.js'

export function CommentCard({
  comment,
}: {
  comment: ReviewComment
}): JSX.Element {
  const initial = comment.author ? comment.author.charAt(0).toUpperCase() : 'U'
  const isResolved = comment.status === 'resolved'

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.borderCard}
      backgroundColor={theme.bgCard}
      paddingX={1}
      marginY={1}
    >
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <Box flexDirection="row" flexShrink={1}>
          <Text bold color={theme.bg} backgroundColor={theme.accent}>
            {` ${initial} `}
          </Text>
          <Text> </Text>
          <Text bold color={theme.text}>
            {comment.author}
          </Text>
          <Text color={theme.textMuted}> {comment.timeAgo}</Text>
        </Box>
        <Text
          bold
          color={isResolved ? theme.added : theme.accent}
          backgroundColor={theme.accentBadge}
        >
          {isResolved ? ' Resolved ' : ' Pending comment '}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.text}>{comment.text}</Text>
      </Box>

      <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
        <Text color={theme.textFaint}>Press r to reply</Text>
        <Box flexDirection="row">
          <Text color={theme.textMuted}>Resolve </Text>
          <Text bold color={theme.bg} backgroundColor={theme.accent}>
            {' Reply '}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
