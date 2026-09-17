/** Unified diff renderer with pane focus coloring (REQ-7). */

import { Box, Text } from 'ink'
import type { JSX } from 'react'
import type { FileDiff, Line } from '../git/types.js'

function gutter(line: Line): string {
  const old = line.oldNo === undefined ? '' : String(line.oldNo)
  const next = line.newNo === undefined ? '' : String(line.newNo)
  return `${old.padStart(4)} ${next.padStart(4)} | `
}

export function DiffView({ file, focused }: { file: FileDiff; focused: boolean }): JSX.Element {
  if (file.hunks.length === 0) {
    return <Text dimColor>no line changes (binary or rename)</Text>
  }
  return (
    <Box flexDirection="column">
      <Text bold color={focused ? 'green' : undefined}>
        {file.newPath || file.oldPath}
      </Text>
      {file.hunks.map((hunk, h) => (
        <Box key={h} flexDirection="column">
          <Text dimColor>{hunk.header}</Text>
          {hunk.lines.map((line, i) => {
            if (line.kind === 'added') {
              return (
                <Text key={i} color="green">
                  + {gutter(line)}
                  {line.text}
                </Text>
              )
            }
            if (line.kind === 'removed') {
              return (
                <Text key={i} color="red">
                  - {gutter(line)}
                  {line.text}
                </Text>
              )
            }
            return (
              <Text key={i} dimColor>
                {line.text}
              </Text>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}