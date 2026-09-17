import { describe, expect, it } from 'vitest'
import type { Hunk, Line } from '../git/types.js'
import {
  clampOffset,
  flattenDiffRows,
  flattenSideBySideRows,
  flattenUnifiedRows,
  followSelection,
  pageSize,
  scrollLines,
  sliceColumns,
  windowOf,
} from './viewport.js'

function ctx(no: number, text = `line ${no}`): Line {
  return { kind: 'context', text: ` ${text}`, oldNo: no, newNo: no }
}

function hunk(header: string, lines: Line[]): Hunk {
  return {
    header,
    oldStart: 1,
    oldLines: lines.length,
    newStart: 1,
    newLines: lines.length,
    lines,
  }
}

describe('clampOffset', () => {
  it('returns 0 when total fits inside window', () => {
    expect(clampOffset(0, 5, 10)).toBe(0)
    expect(clampOffset(3, 5, 10)).toBe(0)
    expect(clampOffset(0, 10, 10)).toBe(0)
  })

  it('clamps negative offset to 0', () => {
    expect(clampOffset(-5, 20, 10)).toBe(0)
  })

  it('clamps excessive offset so window touches end of total', () => {
    expect(clampOffset(15, 20, 10)).toBe(10)
    expect(clampOffset(100, 20, 10)).toBe(10)
  })

  it('preserves valid offset in the middle', () => {
    expect(clampOffset(5, 20, 10)).toBe(5)
  })

  it('handles zero or negative dimensions safely', () => {
    expect(clampOffset(5, 0, 10)).toBe(0)
    expect(clampOffset(5, 10, 0)).toBe(0)
    expect(clampOffset(5, -1, -1)).toBe(0)
  })
})

describe('followSelection', () => {
  it('scrolls down when selection passes bottom of visible window', () => {
    expect(followSelection(0, 10, 10, 20)).toBe(1)
    expect(followSelection(0, 14, 10, 20)).toBe(5)
  })

  it('scrolls up when selection moves above visible window', () => {
    expect(followSelection(5, 3, 10, 20)).toBe(3)
    expect(followSelection(5, 0, 10, 20)).toBe(0)
  })

  it('leaves offset unchanged when selection is already visible', () => {
    expect(followSelection(5, 7, 10, 20)).toBe(5)
    expect(followSelection(0, 0, 10, 20)).toBe(0)
    expect(followSelection(0, 9, 10, 20)).toBe(0)
  })

  it('clamps selection bounds safely', () => {
    expect(followSelection(0, -5, 10, 20)).toBe(0)
    expect(followSelection(0, 50, 10, 20)).toBe(10)
  })

  it('returns 0 when list fits in window', () => {
    expect(followSelection(0, 3, 10, 5)).toBe(0)
  })
})

describe('scrollLines', () => {
  it('advances forward and clamps at the end', () => {
    expect(scrollLines(0, 3, 20, 10)).toBe(3)
    expect(scrollLines(8, 5, 20, 10)).toBe(10)
  })

  it('retreats backward and clamps at zero', () => {
    expect(scrollLines(5, -3, 20, 10)).toBe(2)
    expect(scrollLines(2, -5, 20, 10)).toBe(0)
  })

  it('handles zero delta as no-op', () => {
    expect(scrollLines(4, 0, 20, 10)).toBe(4)
  })
})

describe('pageSize', () => {
  it('leaves one line of overlap', () => {
    expect(pageSize(10)).toBe(9)
    expect(pageSize(20)).toBe(19)
    expect(pageSize(2)).toBe(1)
    expect(pageSize(1)).toBe(1)
    expect(pageSize(0)).toBe(1)
  })
})

describe('windowOf', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  it('returns empty array when size is 0 or items are empty', () => {
    expect(windowOf(items, 0, 0)).toEqual([])
    expect(windowOf([], 0, 5)).toEqual([])
  })

  it('returns the first page', () => {
    expect(windowOf(items, 0, 3)).toEqual(['a', 'b', 'c'])
  })

  it('slices a middle window', () => {
    expect(windowOf(items, 2, 3)).toEqual(['c', 'd', 'e'])
  })

  it('clamps and returns the last window when offset overshoots', () => {
    expect(windowOf(items, 100, 3)).toEqual(['f', 'g', 'h'])
  })

  it('returns entire list when size >= items.length', () => {
    expect(windowOf(items, 0, 20)).toEqual(items)
  })
})

describe('sliceColumns', () => {
  const text = '0123456789'

  it('slices from offset 0', () => {
    expect(sliceColumns(text, 0, 4)).toBe('0123')
  })

  it('slices from a positive offset', () => {
    expect(sliceColumns(text, 4, 4)).toBe('4567')
  })

  it('returns empty string when offset is beyond end', () => {
    expect(sliceColumns(text, 12, 4)).toBe('')
    expect(sliceColumns(text, 500, 4)).toBe('')
  })

  it('clamps negative offset to zero', () => {
    expect(sliceColumns(text, -3, 4)).toBe('0123')
  })

  it('returns empty string on zero or negative width or empty text', () => {
    expect(sliceColumns(text, 0, 0)).toBe('')
    expect(sliceColumns(text, 3, -1)).toBe('')
    expect(sliceColumns('', 0, 4)).toBe('')
  })
})

describe('flattenUnifiedRows', () => {
  it('maps hunks into header and line rows', () => {
    const hunks = [
      hunk('@@ -1,2 +1,2 @@', [
        ctx(1),
        { kind: 'removed', text: '-old', oldNo: 2 },
        { kind: 'added', text: '+new', newNo: 2 },
      ]),
    ]
    const rows = flattenUnifiedRows(hunks)
    expect(rows).toHaveLength(4)
    expect(rows[0]).toEqual({ type: 'hunk', text: '@@ -1,2 +1,2 @@' })
    expect(rows[1]).toMatchObject({ type: 'line', added: false, removed: false })
    expect(rows[2]).toMatchObject({ type: 'line', added: false, removed: true })
    expect(rows[3]).toMatchObject({ type: 'line', added: true, removed: false })
  })
})

describe('flattenSideBySideRows', () => {
  it('pairs removed and added changes strictly row-aligned at same level', () => {
    const hunks = [
      hunk('@@ -1,3 +1,3 @@', [
        ctx(1),
        { kind: 'removed', text: '-oldA', oldNo: 2 },
        { kind: 'added', text: '+newA', newNo: 2 },
        ctx(3),
      ]),
    ]

    const rows = flattenSideBySideRows(hunks)
    expect(rows).toHaveLength(4)
    expect(rows[0]).toEqual({ type: 'hunk', text: '@@ -1,3 +1,3 @@' })
    expect(rows[1]).toMatchObject({
      type: 'side-by-side',
      left: { kind: 'context', lineNo: 1 },
      right: { kind: 'context', lineNo: 1 },
    })
    expect(rows[2]).toMatchObject({
      type: 'side-by-side',
      left: { kind: 'removed', lineNo: 2, text: '-oldA' },
      right: { kind: 'added', lineNo: 2, text: '+newA' },
    })
    expect(rows[3]).toMatchObject({
      type: 'side-by-side',
      left: { kind: 'context', lineNo: 3 },
      right: { kind: 'context', lineNo: 3 },
    })
  })

  it('pads empty cells on the shorter side when additions and deletions differ', () => {
    const rows = flattenDiffRows(
      {
        status: 'modified',
        oldPath: 'f.ts',
        newPath: 'f.ts',
        hunks: [
          hunk('@@ -1,2 +1,2 @@', [
            ctx(1),
            { kind: 'removed', text: '-old1', oldNo: 2 },
            { kind: 'removed', text: '-old2', oldNo: 3 },
            { kind: 'added', text: '+new1', newNo: 2 },
            { kind: 'added', text: '+new2', newNo: 3 },
            { kind: 'added', text: '+new3', newNo: 4 },
            ctx(4),
          ]),
        ],
      },
      'side-by-side',
    )

    expect(rows).toHaveLength(6)
    expect(rows[0]).toEqual({ type: 'hunk', text: '@@ -1,2 +1,2 @@' })
    expect(rows[1]).toMatchObject({
      type: 'side-by-side',
      left: { kind: 'context', lineNo: 1 },
      right: { kind: 'context', lineNo: 1 },
    })
    expect(rows[2]).toMatchObject({
      type: 'side-by-side',
      left: { kind: 'removed', lineNo: 2, text: '-old1' },
      right: { kind: 'added', lineNo: 2, text: '+new1' },
    })
    expect(rows[3]).toMatchObject({
      type: 'side-by-side',
      left: { kind: 'removed', lineNo: 3, text: '-old2' },
      right: { kind: 'added', lineNo: 3, text: '+new2' },
    })
    expect(rows[4]).toMatchObject({
      type: 'side-by-side',
      left: { kind: 'empty', text: '' },
      right: { kind: 'added', lineNo: 4, text: '+new3' },
    })
    expect(rows[5]).toMatchObject({
      type: 'side-by-side',
      left: { kind: 'context', lineNo: 4 },
      right: { kind: 'context', lineNo: 4 },
    })
  })
})
