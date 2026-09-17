import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseDiff } from './parser.js'

function fixture(name: string): string {
  return readFileSync(new URL(`../../../tests/fixtures/${name}`, import.meta.url), 'utf8')
}

describe('parseDiff golden fixtures', () => {
  it('parses a modified file with correct ranges and lines', () => {
    const res = parseDiff(fixture('modified.diff'))
    expect(res.files).toHaveLength(1)
    const file = res.files[0]
    expect(file.status).toBe('modified')
    expect(file.oldPath).toBe('src/app.ts')
    expect(file.newPath).toBe('src/app.ts')
    expect(file.hunks).toHaveLength(1)
    const hunk = file.hunks[0]
    expect(hunk.oldStart).toBe(1)
    expect(hunk.oldLines).toBe(5)
    expect(hunk.newStart).toBe(1)
    expect(hunk.newLines).toBe(6)
    expect(hunk.lines.map((l) => l.kind)).toEqual([
      'context',
      'removed',
      'added',
      'added',
      'context',
      'context',
    ])
    expect(hunk.lines[1]).toMatchObject({ kind: 'removed', oldNo: 2, text: '-const old = 1' })
    expect(hunk.lines[2]).toMatchObject({ kind: 'added', newNo: 2, text: '+const added = 1' })
  })

  it('marks binary files as binary with no hunks', () => {
    const file = parseDiff(fixture('binary.diff')).files[0]
    expect(file.status).toBe('binary')
    expect(file.hunks).toHaveLength(0)
  })

  it('parses renames and their content hunk', () => {
    const file = parseDiff(fixture('rename.diff')).files[0]
    expect(file.status).toBe('renamed')
    expect(file.oldPath).toBe('old.ts')
    expect(file.newPath).toBe('new.ts')
    expect(file.hunks[0]).toMatchObject({ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1 })
  })

  it('returns no files for an empty diff', () => {
    expect(parseDiff(fixture('empty.diff')).files).toEqual([])
  })
})