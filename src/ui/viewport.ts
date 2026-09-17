/** Pure viewport math for clipped, scrollable panes (no React, no Ink). */

import type { FileDiff, Hunk, Line } from '../git/types.js'
import type { ViewMode } from './keymap.js'

/** Clamp a window offset so a window of `size` over `total` stays in range. */
export function clampOffset(offset: number, total: number, size: number): number {
  const safeSize = Math.max(0, size)
  const safeTotal = Math.max(0, total)
  if (safeSize <= 0 || safeTotal <= safeSize) return 0
  return Math.min(Math.max(0, offset), safeTotal - safeSize)
}

/** Return the offset that keeps `selected` inside the visible window. */
export function followSelection(
  offset: number,
  selected: number,
  size: number,
  total: number,
): number {
  const safeSize = Math.max(0, size)
  const safeTotal = Math.max(0, total)
  if (safeSize <= 0 || safeTotal <= safeSize) return 0
  const safeSelected = Math.min(Math.max(0, selected), safeTotal - 1)
  if (safeSelected < offset) return safeSelected
  if (safeSelected >= offset + safeSize) return safeSelected - safeSize + 1
  return clampOffset(offset, safeTotal, safeSize)
}

/** Scroll a window by `delta` lines and clamp into range. */
export function scrollLines(
  offset: number,
  delta: number,
  total: number,
  size: number,
): number {
  return clampOffset(Math.max(0, offset) + delta, total, size)
}

/** Lines per page (keep one line of context). */
export function pageSize(size: number): number {
  return Math.max(1, size - 1)
}

/** The visible slice of `items` at `offset`, clamped, sized to `size`. */
export function windowOf<T>(
  items: readonly T[],
  offset: number,
  size: number,
): readonly T[] {
  if (size <= 0 || items.length === 0) return []
  const start = clampOffset(offset, items.length, size)
  return items.slice(start, start + size)
}

/** Horizontal window of one line; safe with offsets beyond the string. */
export function sliceColumns(text: string, hOffset: number, width: number): string {
  if (width <= 0) return ''
  const start = Math.max(0, hOffset)
  if (start >= text.length) return ''
  return text.slice(start, start + width)
}

/** A cell in a side-by-side split row. */
export interface SideCell {
  line?: Line
  lineNo?: number
  text: string
  kind: 'context' | 'removed' | 'added' | 'empty'
}

/** A renderable diff row: either a hunk header, a unified code line, or a side-by-side aligned line pair. */
export type DiffRow =
  | { type: 'hunk'; text: string }
  | {
      type: 'line'
      line: Line
      added: boolean
      removed: boolean
    }
  | {
      type: 'side-by-side'
      left: SideCell
      right: SideCell
    }

/** Flatten hunks into unified diff rows. */
export function flattenUnifiedRows(hunks: readonly Hunk[]): DiffRow[] {
  const rows: DiffRow[] = []
  for (const hunk of hunks) {
    rows.push({ type: 'hunk', text: hunk.header })
    for (const line of hunk.lines) {
      rows.push({
        type: 'line',
        line,
        added: line.kind === 'added',
        removed: line.kind === 'removed',
      })
    }
  }
  return rows
}

/** Flatten hunks into row-aligned side-by-side line pairs (left = old/removed, right = new/added). */
export function flattenSideBySideRows(hunks: readonly Hunk[]): DiffRow[] {
  const rows: DiffRow[] = []

  for (const hunk of hunks) {
    rows.push({ type: 'hunk', text: hunk.header })

    let i = 0
    while (i < hunk.lines.length) {
      const line = hunk.lines[i]

      if (line.kind === 'context') {
        rows.push({
          type: 'side-by-side',
          left: {
            line,
            lineNo: line.oldNo,
            text: line.text,
            kind: 'context',
          },
          right: {
            line,
            lineNo: line.newNo,
            text: line.text,
            kind: 'context',
          },
        })
        i++
      } else {
        const removed: Line[] = []
        const added: Line[] = []

        while (i < hunk.lines.length && hunk.lines[i].kind !== 'context') {
          const l = hunk.lines[i]
          if (l.kind === 'removed') {
            removed.push(l)
          } else if (l.kind === 'added') {
            added.push(l)
          }
          i++
        }

        const count = Math.max(removed.length, added.length)
        for (let k = 0; k < count; k++) {
          const rem = removed[k]
          const add = added[k]

          rows.push({
            type: 'side-by-side',
            left: rem
              ? {
                  line: rem,
                  lineNo: rem.oldNo,
                  text: rem.text,
                  kind: 'removed',
                }
              : {
                  text: '',
                  kind: 'empty',
                },
            right: add
              ? {
                  line: add,
                  lineNo: add.newNo,
                  text: add.text,
                  kind: 'added',
                }
              : {
                  text: '',
                  kind: 'empty',
                },
          })
        }
      }
    }
  }

  return rows
}

/** Flatten hunks into a single list of rows for vertical scrolling (unified or side-by-side). */
export function flattenDiffRows(
  file: FileDiff,
  viewMode: ViewMode = 'unified',
): DiffRow[] {
  return viewMode === 'side-by-side'
    ? flattenSideBySideRows(file.hunks)
    : flattenUnifiedRows(file.hunks)
}
