import { cleanup, render } from 'ink-testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { StatusBar } from './statusbar.js'

afterEach(() => cleanup())

describe('StatusBar', () => {
  it('renders branch and commitHash when both are provided', () => {
    const { lastFrame } = render(
      <StatusBar
        pane="tree"
        viewMode="side-by-side"
        fileCount={3}
        selectedFile={0}
        branch="main"
        commitHash="71dbfe7"
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('main (71dbfe7)')
    expect(frame).toContain('UTF-8')
    expect(frame).toContain('q quit')
  })

  it('renders only commitHash when branch is not provided', () => {
    const { lastFrame } = render(
      <StatusBar
        pane="tree"
        viewMode="side-by-side"
        fileCount={3}
        selectedFile={0}
        commitHash="71dbfe7"
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('71dbfe7')
    expect(frame).not.toContain('(')
    expect(frame).not.toContain(')')
  })

  it('renders only branch when commitHash is not provided', () => {
    const { lastFrame } = render(
      <StatusBar
        pane="tree"
        viewMode="side-by-side"
        fileCount={3}
        selectedFile={0}
        branch="feature/diff-view"
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('feature/diff-view')
    expect(frame).not.toContain('(')
  })

  it('renders cleanly without hardcoded hash when neither branch nor commitHash is provided', () => {
    const { lastFrame } = render(
      <StatusBar
        pane="tree"
        viewMode="side-by-side"
        fileCount={3}
        selectedFile={0}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).not.toContain('a8f492b')
    expect(frame).toContain('UTF-8')
    expect(frame).toContain('q quit')
  })
})
