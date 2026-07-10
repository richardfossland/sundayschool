import { describe, it, expect } from 'vitest'
import type { SongDoc } from '@/types/song'
import {
  classifyDuration,
  fillRests,
  splitBars,
  planScore,
  vexflowKeySpec,
  type Bar,
} from './notation'

// Minimal doc factory — sections just need to tile [0, totalBeats].
function doc(partial: Partial<SongDoc>): SongDoc {
  const totalBeats = partial.totalBeats ?? 16
  return {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats,
    keySignature: 'C',
    sections: [{ id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: totalBeats }],
    notes: [],
    chords: [],
    ...partial,
  }
}

const barBeats = (bars: { beats: number }[]) => bars.map((b) => b.beats)

describe('classifyDuration', () => {
  it('classifies plain power-of-two values', () => {
    expect(classifyDuration(4)).toEqual({ code: 'w', dots: 0, triplet: false })
    expect(classifyDuration(2)).toEqual({ code: 'h', dots: 0, triplet: false })
    expect(classifyDuration(1)).toEqual({ code: 'q', dots: 0, triplet: false })
    expect(classifyDuration(0.5)).toEqual({ code: '8', dots: 0, triplet: false })
    expect(classifyDuration(0.25)).toEqual({ code: '16', dots: 0, triplet: false })
  })
  it('classifies dotted values as a base code + one dot', () => {
    expect(classifyDuration(3)).toEqual({ code: 'h', dots: 1, triplet: false }) // dotted half
    expect(classifyDuration(1.5)).toEqual({ code: 'q', dots: 1, triplet: false }) // dotted quarter
    expect(classifyDuration(0.75)).toEqual({ code: '8', dots: 1, triplet: false }) // dotted eighth
  })
  it('detects triplet eighths and quarters', () => {
    expect(classifyDuration(1 / 3)).toEqual({ code: '8', dots: 0, triplet: true })
    expect(classifyDuration(2 / 3)).toEqual({ code: 'q', dots: 0, triplet: true })
  })
  it('prefers the nearest representation (dotted quarter beats triplet half)', () => {
    // 1.5 is exactly a dotted quarter, so it must not be read as a triplet half (4/3).
    expect(classifyDuration(1.5).triplet).toBe(false)
  })
})

describe('fillRests', () => {
  it('splits a gap into rests that sum to its length', () => {
    for (const len of [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 4.75]) {
      const sum = fillRests(len).reduce((a, r) => a + r.beats, 0)
      expect(sum).toBeCloseTo(len, 6)
    }
  })
  it('returns nothing for a zero gap', () => {
    expect(fillRests(0)).toEqual([])
  })
})

describe('splitBars', () => {
  it('no pickup: 4/4 song splits into full bars numbered from 1', () => {
    const bars = splitBars(doc({ beatsPerBar: 4, totalBeats: 12 }))
    expect(bars.map((b) => b.number)).toEqual([1, 2, 3])
    expect(barBeats(bars)).toEqual([4, 4, 4])
    expect(bars[0].isPickup).toBe(false)
  })
  it('with a 1-beat pickup in 3/4: pickup is bar 0 (1 beat), first full bar is bar 1', () => {
    const bars = splitBars(doc({ timeSignature: '3/4', beatsPerBar: 3, pickupBeats: 1, totalBeats: 10 }))
    expect(bars[0]).toMatchObject({ number: 0, startBeat: 0, endBeat: 1, beats: 1, isPickup: true })
    expect(bars[1]).toMatchObject({ number: 1, startBeat: 1, endBeat: 4, beats: 3 })
    expect(bars.map((b) => b.number)).toEqual([0, 1, 2, 3])
    expect(barBeats(bars)).toEqual([1, 3, 3, 3])
  })
  it('keeps a short final bar when the song does not fill it', () => {
    const bars = splitBars(doc({ beatsPerBar: 4, totalBeats: 10 }))
    expect(barBeats(bars)).toEqual([4, 4, 2])
  })
})

describe('planScore — voice splitting', () => {
  it('routes notes to treble (R) and bass (L) by hand', () => {
    const plan = planScore(
      doc({
        totalBeats: 4,
        notes: [
          { p: 72, t: 0, d: 1, h: 'R' },
          { p: 48, t: 0, d: 2, h: 'L' },
          { p: 74, t: 1, d: 1, h: 'R' },
        ],
      }),
    )
    const bar = plan.bars[0]
    const rNotes = bar.R.filter((t) => t.kind === 'note')
    const lNotes = bar.L.filter((t) => t.kind === 'note')
    expect(rNotes.map((t) => t.midis)).toEqual([[72], [74]])
    expect(lNotes.map((t) => t.midis)).toEqual([[48]])
  })

  it('groups simultaneous same-hand notes into one chord token', () => {
    const plan = planScore(
      doc({
        totalBeats: 4,
        notes: [
          { p: 60, t: 0, d: 2, h: 'R' },
          { p: 64, t: 0, d: 2, h: 'R' },
          { p: 67, t: 0, d: 2, h: 'R' },
        ],
      }),
    )
    const notes = plan.bars[0].R.filter((t) => t.kind === 'note')
    expect(notes).toHaveLength(1)
    expect(notes[0].midis).toEqual([60, 64, 67]) // sorted low→high
    expect(notes[0].keys).toEqual(['c/4', 'e/4', 'g/4'])
  })

  it('fills rests so each hand voice sums to the bar length', () => {
    const plan = planScore(
      doc({
        totalBeats: 4,
        notes: [
          { p: 60, t: 1, d: 1, h: 'R' }, // leaves a 1-beat rest before and 2 after
        ],
      }),
    )
    const bar = plan.bars[0]
    const sum = (ts: Bar['R']) => ts.reduce((a, t) => a + t.beats, 0)
    expect(sum(bar.R)).toBeCloseTo(4, 6)
    expect(sum(bar.L)).toBeCloseTo(4, 6) // empty hand becomes a full bar of rests
    expect(bar.R[0].kind).toBe('rest')
    expect(bar.R.filter((t) => t.kind === 'note')).toHaveLength(1)
  })

  it('uses key-aware spelling for keys (Eb major: MIDI 68 is ab, not g#)', () => {
    const plan = planScore(
      doc({
        keySignature: 'Eb',
        totalBeats: 4,
        notes: [{ p: 68, t: 0, d: 1, h: 'R' }],
      }),
    )
    expect(plan.bars[0].R[0].keys).toEqual(['ab/4'])
  })
})

describe('planScore — ties', () => {
  it('resolves a tie flag into StaveTie metadata across a barline', () => {
    // A note held from the end of bar 1 into bar 2 (4/4), authored as two tied notes.
    const plan = planScore(
      doc({
        beatsPerBar: 4,
        totalBeats: 8,
        notes: [
          { p: 67, t: 3, d: 1, h: 'R', tie: true }, // last beat of bar 1
          { p: 67, t: 4, d: 2, h: 'R' }, // start of bar 2
        ],
      }),
    )
    expect(plan.ties).toHaveLength(1)
    const tie = plan.ties[0]
    expect(tie.hand).toBe('R')
    expect(tie.fromBar).toBe(0)
    expect(tie.toBar).toBe(1)
    // The referenced tokens exist and carry the tied pitch.
    expect(plan.bars[tie.fromBar].R[tie.fromToken].midis[tie.fromKey]).toBe(67)
    expect(plan.bars[tie.toBar].R[tie.toToken].midis[tie.toKey]).toBe(67)
  })

  it('ignores a tie whose partner is missing', () => {
    const plan = planScore(
      doc({
        totalBeats: 4,
        notes: [{ p: 67, t: 0, d: 1, h: 'R', tie: true }], // nothing at beat 1
      }),
    )
    expect(plan.ties).toEqual([])
  })

  it('ties a chord member by its key index', () => {
    const plan = planScore(
      doc({
        totalBeats: 4,
        notes: [
          { p: 60, t: 0, d: 1, h: 'R' },
          { p: 64, t: 0, d: 1, h: 'R', tie: true }, // only the upper note is tied
          { p: 64, t: 1, d: 1, h: 'R' },
        ],
      }),
    )
    expect(plan.ties).toHaveLength(1)
    const tie = plan.ties[0]
    // In the chord [60, 64], the tied member (64) is key index 1.
    expect(plan.bars[tie.fromBar].R[tie.fromToken].midis[tie.fromKey]).toBe(64)
  })
})

describe('vexflowKeySpec', () => {
  it('maps major keys verbatim and minor keys with an m suffix', () => {
    expect(vexflowKeySpec('C')).toBe('C')
    expect(vexflowKeySpec('Eb')).toBe('Eb')
    expect(vexflowKeySpec('F#')).toBe('F#')
    expect(vexflowKeySpec('g')).toBe('Gm')
    expect(vexflowKeySpec('a')).toBe('Am')
  })
})
