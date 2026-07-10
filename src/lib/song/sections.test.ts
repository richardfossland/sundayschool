import { describe, it, expect } from 'vitest'
import type { SongDoc } from '@/types/song'
import {
  sectionOf,
  notesInRange,
  chordsInRange,
  sectionLoopRange,
  barOfBeat,
} from './sections'

function doc(pickupBeats = 0): SongDoc {
  return {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats,
    totalBeats: 16,
    keySignature: 'C',
    sections: [
      { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: 8 },
      { id: 'ref', kind: 'refrain', label: 'Refreng', startBeat: 8, endBeat: 16 },
    ],
    notes: [
      { p: 60, t: 0, d: 1, h: 'R' },
      { p: 62, t: 4, d: 1, h: 'R' },
      { p: 64, t: 8, d: 1, h: 'R' },
    ],
    chords: [
      { t: 0, d: 4, r: 0, q: '' },
      { t: 8, d: 4, r: 7, q: '' },
    ],
  }
}

describe('sectionOf', () => {
  it('finds the section spanning a beat (start inclusive, end exclusive)', () => {
    expect(sectionOf(doc(), 0)?.id).toBe('v1')
    expect(sectionOf(doc(), 7.9)?.id).toBe('v1')
    expect(sectionOf(doc(), 8)?.id).toBe('ref')
    expect(sectionOf(doc(), 15.9)?.id).toBe('ref')
  })
  it('returns null outside the song', () => {
    expect(sectionOf(doc(), -1)).toBeNull()
    expect(sectionOf(doc(), 16)).toBeNull()
  })
  it('sections tile [0, totalBeats] — every beat lands somewhere', () => {
    const d = doc()
    for (let b = 0; b < d.totalBeats; b++) expect(sectionOf(d, b)).not.toBeNull()
  })
})

describe('notesInRange / chordsInRange', () => {
  it('includes onsets in [start, end)', () => {
    expect(notesInRange(doc(), 0, 8).map((n) => n.p)).toEqual([60, 62])
    expect(chordsInRange(doc(), 0, 8).map((c) => c.t)).toEqual([0])
    expect(notesInRange(doc(), 8, 16).map((n) => n.p)).toEqual([64])
  })
})

describe('sectionLoopRange', () => {
  it('returns [startBeat, endBeat]', () => {
    expect(sectionLoopRange(doc().sections[1])).toEqual([8, 16])
  })
})

describe('barOfBeat', () => {
  it('no pickup: beat 0 is bar 1', () => {
    const d = doc(0)
    expect(barOfBeat(d, 0)).toBe(1)
    expect(barOfBeat(d, 4)).toBe(2)
    expect(barOfBeat(d, 8)).toBe(3)
    expect(barOfBeat(d, 15)).toBe(4)
  })
  it('with a 1-beat pickup: pickup is bar 0, first full bar is bar 1', () => {
    const d = doc(1)
    expect(barOfBeat(d, 0)).toBe(0)
    expect(barOfBeat(d, 0.5)).toBe(0)
    expect(barOfBeat(d, 1)).toBe(1)
    expect(barOfBeat(d, 4.9)).toBe(1)
    expect(barOfBeat(d, 5)).toBe(2)
  })
})
