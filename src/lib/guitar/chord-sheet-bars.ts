import type { SongDoc } from '@/types/song'
import { splitBars } from '@/lib/notation'

// ── Chord-sheet bars ─────────────────────────────────────────────────────────
// The akkordskjema and the engraved notation must show the SAME bars. The sheet
// used to lay out its own grid inside each section (restarting at the section's
// first beat), so any section that did not begin exactly on a bar line produced
// half bars that exist nowhere else — the two views then disagreed about where
// bar 9 was. This module takes the ONE bar list, `splitBars(doc)`, and only
// decides which section each bar is displayed under.

const EPS = 1e-6

export interface SheetBar {
  start: number
  end: number
}

export interface SectionRange {
  startBeat: number
  endBeat: number
}

/**
 * Bucket `splitBars(doc)` into the given sections, by the section each bar's
 * START beat falls in.
 *
 *  - A bar beginning before the first section (an opptakt) joins the first one.
 *  - A bar beginning in a gap between sections joins the last section that has
 *    already started.
 *  - A section too short to own a whole bar keeps a single cell covering its own
 *    range, so a section can never silently vanish from the chart.
 *
 * Everything else is a straight partition: concatenating the result reproduces
 * `splitBars(doc)` bar for bar.
 */
export function barsBySection(doc: SongDoc, sections: SectionRange[]): SheetBar[][] {
  const out: SheetBar[][] = sections.map(() => [])
  if (sections.length === 0) return out

  for (const bar of splitBars(doc)) {
    let idx = -1
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i]
      if (bar.startBeat >= s.startBeat - EPS && bar.startBeat < s.endBeat - EPS) {
        idx = i
        break
      }
      if (bar.startBeat >= s.startBeat - EPS) idx = i // in a gap: the last started one
    }
    if (idx === -1) idx = 0 // before every section (opptakt)
    out[idx].push({ start: bar.startBeat, end: bar.endBeat })
  }

  for (let i = 0; i < sections.length; i++) {
    if (out[i].length === 0) {
      out[i] = [{ start: sections[i].startBeat, end: sections[i].endBeat }]
    }
  }
  return out
}
