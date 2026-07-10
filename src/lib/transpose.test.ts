import { describe, it, expect } from 'vitest'
import type { SongDoc } from '@/types/song'
import { nearestOffset, transposeDoc, transposeKeySignature } from './transpose'
import { pitchClass } from './music'

function sampleDoc(): SongDoc {
  return {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats: 16,
    keySignature: 'Eb',
    sections: [
      { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: 8 },
      { id: 'ref', kind: 'refrain', label: 'Refreng', startBeat: 8, endBeat: 16 },
    ],
    notes: [
      { p: 63, t: 0, d: 1, h: 'R' },
      { p: 51, t: 0, d: 2, h: 'L' },
      { p: 70, t: 8, d: 1, h: 'R' },
    ],
    chords: [
      { t: 0, d: 4, r: 3, q: '' },
      { t: 8, d: 4, r: 8, q: 'm7', b: 3 },
    ],
  }
}

describe('nearestOffset', () => {
  it('stays within −6..+6 and takes the short path', () => {
    expect(nearestOffset(0, 5)).toBe(5)
    expect(nearestOffset(0, 6)).toBe(6)
    expect(nearestOffset(0, 7)).toBe(-5)
    expect(nearestOffset(0, 0)).toBe(0)
    expect(nearestOffset(9, 0)).toBe(3)
  })
})

describe('transposeKeySignature', () => {
  it('respells prettily and keeps the mode', () => {
    expect(transposeKeySignature('Eb', 7)).toBe('Bb')
    expect(transposeKeySignature('C', 2)).toBe('D')
    expect(transposeKeySignature('a', 3)).toBe('c')
  })
})

describe('transposeDoc — round trip', () => {
  it('+7 then −7 is the identity', () => {
    const doc = sampleDoc()
    const back = transposeDoc(transposeDoc(doc, 7), -7)
    expect(back).toEqual(doc)
  })

  it('sections and timing are untouched', () => {
    const doc = sampleDoc()
    const up = transposeDoc(doc, 5)
    expect(up.sections).toEqual(doc.sections)
    expect(up.totalBeats).toBe(doc.totalBeats)
    expect(up.notes.map((n) => n.t)).toEqual(doc.notes.map((n) => n.t))
  })

  it('12× +1 is octave-equivalent (same pitch classes, same chord roots)', () => {
    const doc = sampleDoc()
    let cur = doc
    for (let i = 0; i < 12; i++) cur = transposeDoc(cur, 1)
    expect(cur.notes.map((n) => pitchClass(n.p))).toEqual(doc.notes.map((n) => pitchClass(n.p)))
    expect(cur.notes.map((n) => n.p)).toEqual(doc.notes.map((n) => n.p + 12))
    expect(cur.chords.map((c) => c.r)).toEqual(doc.chords.map((c) => c.r))
  })

  it('notes shift in absolute MIDI; chord roots wrap as pitch classes', () => {
    const doc = sampleDoc()
    const up = transposeDoc(doc, 3)
    expect(up.notes[0].p).toBe(66)
    expect(up.chords[0].r).toBe(pitchClass(3 + 3))
    expect(up.chords[1].b).toBe(pitchClass(3 + 3))
  })
})
