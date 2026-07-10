import { describe, it, expect } from 'vitest'
import {
  quantizeBeat,
  splitHand,
  splitPointFor,
  median,
  autoSections,
  midiKeyToSignature,
} from './midi-import'
import { docInvariants } from './song/format'
import type { SongDoc } from '@/types/song'

// The File-based entry point is exercised in the browser; the pure heuristics it
// leans on carry the correctness worth pinning down here.

describe('quantizeBeat', () => {
  it('snaps to the nearest 1/4-beat grid', () => {
    expect(quantizeBeat(0.24)).toBeCloseTo(0.25)
    expect(quantizeBeat(1.01)).toBeCloseTo(1.0)
    expect(quantizeBeat(2.13)).toBeCloseTo(2.25)
  })

  it('snaps to a triplet subdivision when clearly closer', () => {
    expect(quantizeBeat(1 / 3)).toBeCloseTo(1 / 3)
    expect(quantizeBeat(2 / 3)).toBeCloseTo(2 / 3)
  })

  it('is idempotent on grid values', () => {
    for (const v of [0, 0.25, 0.5, 1, 2.75]) expect(quantizeBeat(v)).toBeCloseTo(v)
  })
})

describe('splitHand / splitPointFor', () => {
  it('assigns pitches at/above the split to the right hand', () => {
    expect(splitHand(72, 60)).toBe('R')
    expect(splitHand(60, 60)).toBe('R')
    expect(splitHand(48, 60)).toBe('L')
  })

  it('median handles even and odd lengths', () => {
    expect(median([1, 2, 3])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(median([])).toBe(0)
  })

  it('clamps the split point into a sane band around middle C', () => {
    expect(splitPointFor([20, 21, 22])).toBe(52) // very low music → clamp up
    expect(splitPointFor([100, 101, 102])).toBe(67) // very high → clamp down
    expect(splitPointFor([58, 60, 62])).toBe(60)
    expect(splitPointFor([])).toBe(60)
  })
})

describe('autoSections', () => {
  it('tiles [0, totalBeats] exactly, passing docInvariants', () => {
    const beatsPerBar = 4
    const totalBeats = 4 * 4 * 8 + 16 // 8.5 sections worth, rounded to bar
    const sections = autoSections(totalBeats, beatsPerBar)
    // No gaps/overlaps.
    let cursor = 0
    for (const s of sections) {
      expect(s.startBeat).toBeCloseTo(cursor)
      expect(s.endBeat).toBeGreaterThan(s.startBeat)
      cursor = s.endBeat
    }
    expect(cursor).toBeCloseTo(totalBeats)

    // Feed it through the real invariant checker with a minimal doc.
    const doc: SongDoc = {
      formatVersion: 1,
      timeSignature: '4/4',
      beatsPerBar,
      pickupBeats: 0,
      totalBeats,
      keySignature: 'C',
      sections,
      notes: [{ p: 60, t: 0, d: 1, h: 'R' }],
      chords: [],
    }
    expect(docInvariants(doc)).toEqual([])
  })

  it('always produces at least one covering section for a short song', () => {
    const sections = autoSections(6, 4)
    expect(sections.length).toBeGreaterThanOrEqual(1)
    expect(sections[0].startBeat).toBe(0)
    expect(sections[sections.length - 1].endBeat).toBeCloseTo(6)
  })
})

describe('midiKeyToSignature', () => {
  it('lowercases minor keys and keeps major upright', () => {
    expect(midiKeyToSignature('C', 'major')).toBe('C')
    expect(midiKeyToSignature('A', 'minor')).toBe('a')
    expect(midiKeyToSignature('Eb', 'major')).toBe('Eb')
  })
  it('falls back to C on missing/garbage input', () => {
    expect(midiKeyToSignature(undefined, undefined)).toBe('C')
    expect(midiKeyToSignature('H#x', 'major')).toBe('C')
  })
})
