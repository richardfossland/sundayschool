import { describe, it, expect } from 'vitest'
import { barsBySection } from './chord-sheet-bars'
import { splitBars } from '@/lib/notation'
import { seedSongs } from '@/data/songs'
import type { SongDoc } from '@/types/song'

// The invariant this file exists to defend: the akkordskjema shows exactly the
// bars the notation engraves. Before the fix the sheet restarted its grid in
// every section, so any section not starting on a bar line invented half bars —
// and the two views disagreed. A regression here means the chord chart is lying
// about where a bar is, which is the kind of thing a guitarist finds out on a
// Sunday morning.

function flat(doc: SongDoc) {
  const sections =
    doc.sections.length > 0
      ? doc.sections
      : [{ startBeat: 0, endBeat: doc.totalBeats }]
  return barsBySection(doc, sections).flat()
}

describe('barsBySection', () => {
  it('is a straight partition of splitBars for every seed song', () => {
    expect(seedSongs.length).toBeGreaterThan(0)
    for (const seed of seedSongs) {
      const expected = splitBars(seed.doc).map((b) => ({ start: b.startBeat, end: b.endBeat }))
      expect(flat(seed.doc), `bars disagree for ${seed.slug}`).toEqual(expected)
    }
  })

  it('never invents a bar boundary a section start would have caused', () => {
    // A section that begins mid-bar (beat 3 of a 4/4 bar): the old per-section
    // grid produced a 1-beat cell at beat 3. The shared grid must not.
    const doc = {
      totalBeats: 8,
      beatsPerBar: 4,
      pickupBeats: 0,
      sections: [
        { id: 'a', kind: 'verse' as const, label: 'A', startBeat: 0, endBeat: 3 },
        { id: 'b', kind: 'chorus' as const, label: 'B', startBeat: 3, endBeat: 8 },
      ],
    } as unknown as SongDoc

    const buckets = barsBySection(doc, doc.sections)
    expect(buckets.flat()).toEqual([
      { start: 0, end: 4 },
      { start: 4, end: 8 },
    ])
    // Bar 0–4 starts inside section A, bar 4–8 inside section B.
    expect(buckets[0]).toEqual([{ start: 0, end: 4 }])
    expect(buckets[1]).toEqual([{ start: 4, end: 8 }])
  })

  it('puts an opptakt bar under the first section', () => {
    const doc = {
      totalBeats: 9,
      beatsPerBar: 4,
      pickupBeats: 1,
      sections: [{ id: 'a', kind: 'verse' as const, label: 'A', startBeat: 1, endBeat: 9 }],
    } as unknown as SongDoc

    const buckets = barsBySection(doc, doc.sections)
    expect(buckets[0][0]).toEqual({ start: 0, end: 1 }) // the pickup bar
    expect(buckets.flat()).toHaveLength(splitBars(doc).length)
  })

  it('gives a section too short to own a bar a cell of its own range', () => {
    const doc = {
      totalBeats: 8,
      beatsPerBar: 4,
      pickupBeats: 0,
      sections: [
        { id: 'a', kind: 'verse' as const, label: 'A', startBeat: 0, endBeat: 2 },
        { id: 'b', kind: 'bridge' as const, label: 'B', startBeat: 2, endBeat: 4 },
        { id: 'c', kind: 'chorus' as const, label: 'C', startBeat: 4, endBeat: 8 },
      ],
    } as unknown as SongDoc

    const buckets = barsBySection(doc, doc.sections)
    expect(buckets[1]).toEqual([{ start: 2, end: 4 }]) // synthetic, not dropped
    expect(buckets.every((b) => b.length > 0)).toBe(true)
  })
})
