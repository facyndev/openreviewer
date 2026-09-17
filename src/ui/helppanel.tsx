/** Help overlay listing the default key bindings (? closes it, handled by App). */

import { Box, Text } from 'ink'
import type { JSX } from 'react'
import { KEY_HINTS } from './keymap.js'

export function HelpPanel(): JSX.Element {
  return (
    <Box flexDirection="column">
      <Text bold>openreviewer — key bindings</Text>
      {KEY_HINTS.map(([key, label]) => (
        <Box key={key} flexDirection="row">
          <Text bold>{key}</Text>
          <Text dimColor> — {label}</Text>
        </Box>
      ))}
      <Text dimColor>? closes this panel</Text>
    </Box>
  )
}