import { describe, it, expect } from 'vitest'
import type { SongDoc, Hand } from '@/types/song'
import { seedSongs } from '@/data/songs'
import {
  classifyDuration,
  splitDuration,
  fillRests,
  splitBars,
  planScore,
  barLayers,
  tupletGroups,
  vexflowKeySpec,
  type Bar,
  type Token,
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
  it('knows the dotted whole (a full 6/4 bar is one notehead, not a whole note)', () => {
    // Regression: every LH bar of the 6/4 setting (nearer-my-god-to-thee) holds
    // a 6-beat chord, which used to be snapped to a 4-beat whole note.
    expect(classifyDuration(6)).toEqual({ code: 'w', dots: 1, triplet: false })
  })
  it('never inflates an ambiguous value to a longer notehead', () => {
    // 5 sits exactly between a whole (4) and a dotted whole (6): the shorter
    // one wins, and splitDuration is what actually notates the value.
    expect(classifyDuration(5)).toEqual({ code: 'w', dots: 0, triplet: false })
  })
})

describe('splitDuration', () => {
  it('returns one segment for values a single notehead can carry', () => {
    expect(splitDuration(4)).toEqual([{ beats: 4, duration: { code: 'w', dots: 0, triplet: false } }])
    expect(splitDuration(6)).toEqual([{ beats: 6, duration: { code: 'w', dots: 1, triplet: false } }])
    expect(splitDuration(1.5)).toEqual([{ beats: 1.5, duration: { code: 'q', dots: 1, triplet: false } }])
    expect(splitDuration(1 / 3)).toEqual([{ beats: 1 / 3, duration: { code: '8', dots: 0, triplet: true } }])
  })
  it('decomposes an unrepresentable value into tied segments (5 → whole + quarter)', () => {
    // 5 beats inside a 6/4 bar — the value the old nearest-snap silently turned
    // into a single whole note, losing a beat of sound.
    expect(splitDuration(5)).toEqual([
      { beats: 4, duration: { code: 'w', dots: 0, triplet: false } },
      { beats: 1, duration: { code: 'q', dots: 0, triplet: false } },
    ])
    expect(splitDuration(2.5)).toEqual([
      { beats: 2, duration: { code: 'h', dots: 0, triplet: false } },
      { beats: 0.5, duration: { code: '8', dots: 0, triplet: false } },
    ])
  })
  it('preserves the total duration for every value we can meet', () => {
    for (const d of [0.125, 0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 8]) {
      const total = splitDuration(d).reduce((a, s) => a + s.beats, 0)
      expect(total).toBeCloseTo(d, 6)
    }
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
  it('fills a triplet-sized gap with triplet rests instead of losing the twelfth', () => {
    // A gap of 1/3 used to come back as a single 16th rest (0.25) — a twelfth
    // of a beat vanished. Latent until a triplet song (blessed-assurance) has a
    // hand resting mid-tuplet.
    expect(fillRests(1 / 3)).toEqual([{ code: '8', beats: 1 / 3, triplet: true }])
    expect(fillRests(2 / 3)).toEqual([{ code: 'q', beats: 2 / 3, triplet: true }])
    for (const len of [1 / 6, 1 / 3, 2 / 3, 1 + 1 / 3, 5 / 6]) {
      const sum = fillRests(len).reduce((a, r) => a + r.beats, 0)
      expect(sum).toBeCloseTo(len, 6)
    }
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

describe('planScore — notes that reach past the barline', () => {
  // Shape from it-is-well-with-my-soul: a 5-beat LH chord starting in the
  // 1-beat pickup of a 4/4 song. The whole note used to be parked in the pickup
  // bar with its full length, overfilling it, while bar 1 printed a rest under
  // a chord that was still sounding.
  const held = () =>
    planScore(
      doc({
        beatsPerBar: 4,
        pickupBeats: 1,
        totalBeats: 9,
        notes: [{ p: 48, t: 0, d: 5, h: 'L' }],
      }),
    )

  it('cuts the note at the barline instead of overfilling the bar', () => {
    const plan = held()
    const sum = (ts: Token[]) => ts.reduce((a, t) => a + t.beats, 0)
    expect(sum(plan.bars[0].L)).toBeCloseTo(1, 6) // pickup bar: 1 beat
    expect(sum(plan.bars[1].L)).toBeCloseTo(4, 6)
    expect(plan.bars[0].L.map((t) => t.beats)).toEqual([1])
    expect(plan.bars[1].L[0]).toMatchObject({ kind: 'note', beats: 4, midis: [48] })
  })

  it('ties the two halves together so it still reads as one sound', () => {
    const plan = held()
    expect(plan.ties).toHaveLength(1)
    const tie = plan.ties[0]
    expect(tie).toMatchObject({ hand: 'L', fromBar: 0, toBar: 1, fromLayer: 0, toLayer: 0 })
    expect(plan.bars[tie.fromBar].L[tie.fromToken].midis[tie.fromKey]).toBe(48)
    expect(plan.bars[tie.toBar].L[tie.toToken].midis[tie.toKey]).toBe(48)
  })

  it('leaves the following bar free (no rest under a sounding note)', () => {
    const plan = held()
    expect(plan.bars[1].L.filter((t) => t.kind === 'rest')).toHaveLength(0)
    expect(plan.bars[2].L.every((t) => t.kind === 'rest')).toBe(true)
  })
})

describe('planScore — values a single notehead cannot carry', () => {
  // Shape from nearer-my-god-to-thee (6/4): the LH holds the whole bar, and one
  // RH note lasts 5 of the bar's 6 beats.
  const plan = planScore(
    doc({
      timeSignature: '6/4',
      beatsPerBar: 6,
      totalBeats: 12,
      notes: [
        { p: 48, t: 0, d: 6, h: 'L' },
        { p: 69, t: 6, d: 5, h: 'R' },
      ],
    }),
  )

  it('writes a full 6/4 bar as one dotted whole note', () => {
    expect(plan.bars[0].L).toHaveLength(1)
    expect(plan.bars[0].L[0]).toMatchObject({ beats: 6, duration: { code: 'w', dots: 1, triplet: false } })
  })

  it('splits a 5-beat note into tied segments that add back up', () => {
    const notes = plan.bars[1].R.filter((t) => t.kind === 'note')
    expect(notes.map((t) => t.beats)).toEqual([4, 1])
    expect(notes.every((t) => t.midis[0] === 69)).toBe(true)
    expect(notes.reduce((a, t) => a + t.beats, 0)).toBe(5)
    const tie = plan.ties.find((t) => t.hand === 'R')
    expect(tie).toMatchObject({ fromBar: 1, toBar: 1, fromToken: 0, toToken: 1 })
  })
})

describe('planScore — same-onset notes of different length', () => {
  // Shape from holy-holy-holy-firstemmig: an inner voice sustains while the
  // melody keeps moving. Collapsing the chord to the SHORTEST value used to
  // shorten the sustained voice and print a rest where it was still sounding.
  const plan = planScore(
    doc({
      beatsPerBar: 4,
      totalBeats: 8,
      notes: [
        { p: 65, t: 0, d: 6, h: 'R' },
        { p: 70, t: 0, d: 4, h: 'R' },
        { p: 63, t: 4, d: 1, h: 'R' },
        { p: 63, t: 5, d: 1, h: 'R' },
        { p: 67, t: 6, d: 2, h: 'R' },
      ],
    }),
  )

  it('gives the sustained voice its own layer instead of cutting it short', () => {
    const bar = plan.bars[1]
    expect(bar.R2).not.toBeNull()
    const sustained = bar.R2!.filter((t) => t.kind === 'note')
    expect(sustained).toHaveLength(1)
    expect(sustained[0]).toMatchObject({ beats: 2, midis: [65] }) // 2 beats left of the 6
  })

  it('keeps the moving voice on the main layer, unshortened', () => {
    const main = plan.bars[1].R.filter((t) => t.kind === 'note')
    expect(main.map((t) => t.midis)).toEqual([[63], [63], [67]])
    expect(main.map((t) => t.beats)).toEqual([1, 1, 2])
  })

  it('keeps every layer exactly one bar long', () => {
    for (const bar of plan.bars) {
      for (const hand of ['R', 'L'] as Hand[]) {
        for (const layer of barLayers(bar, hand)) {
          expect(layer.reduce((a, t) => a + t.beats, 0)).toBeCloseTo(bar.beats, 6)
        }
      }
    }
  })

  it('notates a short chord member without shortening its long neighbour', () => {
    // Shape from amazing-grace-firstemmig: quarter + eighth on the same beat.
    const p = planScore(
      doc({
        totalBeats: 4,
        notes: [
          { p: 60, t: 0, d: 1, h: 'R' },
          { p: 69, t: 0, d: 0.5, h: 'R' },
          { p: 65, t: 0.5, d: 0.5, h: 'R' },
        ],
      }),
    )
    const bar = p.bars[0]
    expect(bar.R.filter((t) => t.kind === 'note').map((t) => [t.midis, t.beats])).toEqual([
      [[69], 0.5],
      [[65], 0.5],
    ])
    expect(bar.R2).not.toBeNull()
    expect(bar.R2!.filter((t) => t.kind === 'note')).toEqual([
      expect.objectContaining({ midis: [60], beats: 1 }),
    ])
  })
})

describe('tupletGroups', () => {
  // blessed-assurance, bar 3: a quarter, then a triplet quarter + five triplet
  // eighths. Grouping "every 3 tokens" bracketed qT+8T+8T (4/3 of a beat) and
  // left the last two triplets outside any bracket, drawn as plain eighths.
  const bar3 = planScore(
    doc({
      timeSignature: '3/4',
      beatsPerBar: 3,
      totalBeats: 3,
      notes: [
        { p: 74, t: 0, d: 1, h: 'R' },
        { p: 73, t: 1, d: 2 / 3, h: 'R' },
        { p: 73, t: 1 + 2 / 3, d: 1 / 3, h: 'R' },
        { p: 71, t: 2, d: 1 / 3, h: 'R' },
        { p: 69, t: 2 + 1 / 3, d: 1 / 3, h: 'R' },
        { p: 68, t: 2 + 2 / 3, d: 1 / 3, h: 'R' },
      ],
    }),
  ).bars[0].R

  it('closes a bracket on the beat, not on every third notehead', () => {
    expect(bar3.map((t) => [t.duration.code, t.duration.triplet])).toEqual([
      ['q', false],
      ['q', true],
      ['8', true],
      ['8', true],
      ['8', true],
      ['8', true],
    ])
    // Beat 2 = triplet quarter + triplet eighth; beat 3 = three triplet eighths.
    expect(tupletGroups(bar3)).toEqual([
      [1, 2],
      [3, 4, 5],
    ])
  })

  it('leaves no triplet outside a bracket, and never brackets plain notes', () => {
    const bracketed = new Set(tupletGroups(bar3).flat())
    bar3.forEach((tok, i) => expect(bracketed.has(i)).toBe(tok.duration.triplet))
  })

  it('brackets three triplet eighths in a row', () => {
    const plan = planScore(
      doc({
        totalBeats: 1,
        notes: [
          { p: 66, t: 0, d: 1 / 3, h: 'R' },
          { p: 64, t: 1 / 3, d: 1 / 3, h: 'R' },
          { p: 62, t: 2 / 3, d: 1 / 3, h: 'R' },
        ],
      }),
    )
    expect(tupletGroups(plan.bars[0].R)).toEqual([[0, 1, 2]])
  })
})

describe('planScore — invariants over the whole seed library', () => {
  const sum = (ts: Token[]) => ts.reduce((a, t) => a + t.beats, 0)

  it('every voice of every bar is exactly one bar long', () => {
    const bad: string[] = []
    for (const song of seedSongs) {
      for (const bar of planScore(song.doc).bars) {
        for (const hand of ['R', 'L'] as Hand[]) {
          barLayers(bar, hand).forEach((layer, li) => {
            if (Math.abs(sum(layer) - bar.beats) > 1e-6) {
              bad.push(`${song.slug} bar ${bar.number} ${hand}${li}: ${sum(layer)} ≠ ${bar.beats}`)
            }
          })
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('no note is notated shorter than it sounds', () => {
    const bad: string[] = []
    for (const song of seedSongs) {
      const plan = planScore(song.doc)
      // How many beats of notation each (hand, pitch, onset) carries.
      const notated = new Map<string, number>()
      for (const bar of plan.bars) {
        for (const hand of ['R', 'L'] as Hand[]) {
          for (const layer of barLayers(bar, hand)) {
            for (const t of layer) {
              if (t.kind !== 'note') continue
              for (const p of t.midis) {
                const k = `${hand}:${p}:${Math.round(t.onset * 1000)}`
                notated.set(k, (notated.get(k) ?? 0) + t.beats)
              }
            }
          }
        }
      }
      for (const n of song.doc.notes) {
        if (n.t + n.d > song.doc.totalBeats + 1e-6) continue // sounds past the last barline
        let at = n.t
        let acc = 0
        let guard = 0
        while (acc < n.d - 1e-6 && guard++ < 64) {
          const got = notated.get(`${n.h}:${n.p}:${Math.round(at * 1000)}`)
          if (got === undefined) break
          acc += got
          at += got
        }
        if (acc < n.d - 1e-6) bad.push(`${song.slug} ${n.h} p${n.p}@${n.t} d${n.d} → ${acc}`)
      }
    }
    expect(bad).toEqual([])
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
