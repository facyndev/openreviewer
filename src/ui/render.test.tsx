import { renderToString } from 'ink'
import { describe, expect, it } from 'vitest'
import type { FileDiff } from '../services/git/index.js'
import { App } from './app.js'

const files: FileDiff[] = [
  { status: 'modified', oldPath: 'src/a.ts', newPath: 'src/a.ts', hunks: [] },
]

// Render-output integration without a TTY: proves the App render path end to end.
describe('renderToString integration', () => {
  it('renders file names and status bar', () => {
    const out = renderToString(<App files={files} />)
    expect(out).toContain('src/a.ts')
    expect(out).toContain('openreviewer')
  })

  it('renders diff lines for non-empty hunks', () => {
    const withHunks: FileDiff[] = [
      {
        status: 'modified',
        oldPath: 'x.ts',
        newPath: 'x.ts',
        hunks: [
          {
            header: '@@ -1,2 +1,2 @@',
            oldStart: 1,
            oldLines: 2,
            newStart: 1,
            newLines: 2,
            lines: [
              { kind: 'context', text: ' base', oldNo: 1, newNo: 1 },
              { kind: 'removed', text: '-old', oldNo: 2 },
              { kind: 'added', text: '+new', newNo: 2 },
            ],
          },
        ],
      },
    ]
    const out = renderToString(<App files={withHunks} />)
    expect(out).toContain('@@ -1,2 +1,2 @@')
    expect(out).toContain('x.ts')
  })
})