import { describe, expect, it } from 'vitest'
import { ArgError, parseArgs } from './args.js'

describe('parseArgs', () => {
  it('accepts a --diff range', () => {
    expect(parseArgs(['--diff', 'HEAD~2..HEAD'])).toEqual({ help: false, range: { from: 'HEAD~2', to: 'HEAD' } })
  })

  it('accepts --from / --to with HEAD default for the missing side', () => {
    expect(parseArgs(['--from', 'HEAD~1'])).toEqual({ help: false, range: { from: 'HEAD~1', to: 'HEAD' } })
    expect(parseArgs(['--to', 'v1.0'])).toEqual({ help: false, range: { from: 'HEAD', to: 'v1.0' } })
  })

  it('accepts no arguments', () => {
    expect(parseArgs([])).toEqual({ help: false })
  })

  it.each([
    ['--output=x'],
    ['-o'],
    ['HEAD~1 --output=x'],
    ['a b'],
    ['a\nb'],
  ])('rejects injection-style or malformed ref: %s', (arg) => {
    expect(() => parseArgs(['--diff', arg])).toThrow(ArgError)
  })

  it('rejects an unknown option', () => {
    expect(() => parseArgs(['--wat'])).toThrow(ArgError)
  })
})