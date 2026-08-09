import { describe, it, expect } from 'vitest'
import type { SongDoc } from '@/types/song'
import { generateDrumTrack, pickGroove, hitsToEngineEvents, lanesUsed } from './drum-track'
import { laneOf } from './drum-lanes'

// The generator is pure: same doc in, same track out. The invariants that
// matter: the meter picks a matching groove, the pickup stays silent, the whole
// song is covered, fills land in the bar before each section boundary, and the
// boundary downbeat gets a crash.

const CRASH = 49

/** Minimal doc factory — sections tile [0, totalBeats]. */
function doc(over: Partial<SongDoc> = {}): SongDoc {
  return {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats: 32,
    keySignature: 'C',
    sections: [
      { id: 'a', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 16 },
      { id: 'b', kind: 'refrain', label: 'Refreng', startBeat: 16, endBeat: 32 },
    ],
    notes: [],
    chords: [],
    ...over,
  }
}

describe('pickGroove', () => {
  it('matches the time signature: 4/4 vs 3/4 vs 6/8 pick different grooves', () => {
    const g44 = pickGroove({ timeSignature: '4/4', beatsPerBar: 4 })
    const g34 = pickGroove({ timeSignature: '3/4', beatsPerBar: 3 })
    const g68 = pickGroove({ timeSignature: '6/8', beatsPerBar: 3 })
    expect(g44?.timeSignature).toBe('4/4')
    expect(g34?.id).toBe('vals')
    expect(g68?.id).toBe('ballade-68')
    expect(new Set([g44?.id, g34?.id, g68?.id]).size).toBe(3)
  })

  it('lets the tempo choose the 4/4 feel (slow → ballade, fast → shout)', () => {
    expect(pickGroove({ timeSignature: '4/4', beatsPerBar: 4 }, { bpm: 63 })?.style).toBe('ballade')
    expect(pickGroove({ timeSignature: '4/4', beatsPerBar: 4 }, { bpm: 96 })?.style).toBe('gospel')
    expect(pickGroove({ timeSignature: '4/4', beatsPerBar: 4 }, { bpm: 130 })?.style).toBe('shout')
  })

  it('honours an explicit style override', () => {
    expect(pickGroove({ timeSignature: '4/4', beatsPerBar: 4 }, { style: 'train' })?.id).toBe('train-beat')
    expect(pickGroove({ timeSignature: '4/4', beatsPerBar: 4 }, { style: 'halftime' })?.id).toBe('halftime')
  })

  it('picks the 12/8 shuffle for 12/8', () => {
    expect(pickGroove({ timeSignature: '12/8', beatsPerBar: 6 })?.id).toBe('gospel-shuffle-128')
  })

  it('returns null for an unknown meter (generator then synthesises)', () => {
    expect(pickGroove({ timeSignature: '5/4', beatsPerBar: 5 })).toBeNull()
  })

  it('never matches a meter on beat COUNT alone across subdivisions', () => {
    // 6/4 and 12/8 both count 6 quarter beats, but a straight 6/4 hymn must not
    // be handed the 12/8 triplet shuffle. No 6/4 groove exists → synthesise.
    expect(pickGroove({ timeSignature: '6/4', beatsPerBar: 6 })).toBeNull()
    // …while the compound meters still find their compound grooves.
    expect(pickGroove({ timeSignature: '12/8', beatsPerBar: 6 })?.id).toBe('gospel-shuffle-128')
    expect(pickGroove({ timeSignature: '6/8', beatsPerBar: 3 })?.id).toBe('ballade-68')
    // An explicit style override still wins, whatever the meter.
    expect(pickGroove({ timeSignature: '6/4', beatsPerBar: 6 }, { style: 'shuffle' })?.id).toBe(
      'gospel-shuffle-128',
    )
  })
})

describe('generateDrumTrack', () => {
  it('covers every bar of the song and never plays past the end', () => {
    const d = doc()
    const hits = generateDrumTrack(d)
    expect(hits.length).toBeGreaterThan(0)
    for (let bar = 0; bar < d.totalBeats / d.beatsPerBar; bar++) {
      const inBar = hits.filter((h) => h.t >= bar * 4 && h.t < (bar + 1) * 4)
      expect(inBar.length).toBeGreaterThan(0)
    }
    for (const h of hits) {
      expect(h.t).toBeGreaterThanOrEqual(0)
      expect(h.t).toBeLessThan(d.totalBeats)
    }
  })

  it('rests through the pickup — no hits before the first full bar', () => {
    const d = doc({
      pickupBeats: 1,
      totalBeats: 25,
      sections: [
        { id: 'a', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 13 },
        { id: 'b', kind: 'refrain', label: 'Refreng', startBeat: 13, endBeat: 25 },
      ],
      timeSignature: '3/4',
      beatsPerBar: 3,
    })
    const hits = generateDrumTrack(d)
    expect(hits.length).toBeGreaterThan(0)
    for (const h of hits) expect(h.t).toBeGreaterThanOrEqual(1)
    // Bars anchor at the pickup: the first downbeat kick is at t = 1.
    expect(hits.some((h) => h.t === 1 && h.p === 36)).toBe(true)
  })

  it('places a crash on each internal section downbeat', () => {
    const hits = generateDrumTrack(doc())
    expect(hits.some((h) => h.p === CRASH && h.t === 16)).toBe(true)
    // No crash at the very start (not a section *boundary*).
    expect(hits.some((h) => h.p === CRASH && h.t === 0)).toBe(false)
  })

  it('swaps the bar before a section boundary for a fill (toms/snare run)', () => {
    const hits = generateDrumTrack(doc(), undefined, 96) // gospel-8, diff 1 → snare fill
    const fillBar = hits.filter((h) => h.t >= 12 && h.t < 16)
    const plainBar = hits.filter((h) => h.t >= 8 && h.t < 12)
    // The fill bar differs from a plain groove bar and ends in the rising
    // snare eighths of fill-snare (t 14, 14.5, 15, 15.5 relative 2..3.5).
    expect(fillBar.map((h) => `${h.t}:${h.p}`)).not.toEqual(plainBar.map((h) => `${h.t - 4}:${h.p}`))
    for (const t of [14, 14.5, 15, 15.5]) {
      expect(fillBar.some((h) => h.t === t && h.p === 38)).toBe(true)
    }
  })

  it('synthesises a fill for non-4/4 meters (3/4 song still gets fill + crash)', () => {
    const d = doc({
      timeSignature: '3/4',
      beatsPerBar: 3,
      totalBeats: 24,
      sections: [
        { id: 'a', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 12 },
        { id: 'b', kind: 'refrain', label: 'Refreng', startBeat: 12, endBeat: 24 },
      ],
    })
    const hits = generateDrumTrack(d)
    expect(hits.some((h) => h.p === CRASH && h.t === 12)).toBe(true)
    // Synthesised fill: snare eighths rising into the boundary.
    expect(hits.some((h) => h.t === 11.5 && h.p === 38)).toBe(true)
  })

  it('never emits a pitch outside the drawable lanes', () => {
    for (const d of [doc(), doc({ timeSignature: '12/8', beatsPerBar: 6, totalBeats: 48 })]) {
      for (const h of generateDrumTrack(d)) expect(laneOf(h.p)).not.toBeNull()
    }
  })

  it('falls back to a synthesised beat for unknown meters', () => {
    const d = doc({
      timeSignature: '5/4',
      beatsPerBar: 5,
      totalBeats: 20,
      sections: [{ id: 'a', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 20 }],
    })
    const hits = generateDrumTrack(d)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => h.p === 36 && h.t === 0)).toBe(true) // downbeat kick
  })

  it('snaps an off-grid section boundary to the barline (fill + crash)', () => {
    // come-thou-fount's shape: 3/4 with a 1-beat pickup, phrases written at
    // 12/24/36 — none of which is a barline (bars run 1, 4, 7, 10, 13 …). The
    // crash used to land on the third beat of a bar; it must land on a downbeat.
    const d = doc({
      timeSignature: '3/4',
      beatsPerBar: 3,
      pickupBeats: 1,
      totalBeats: 48,
      sections: [
        { id: 'a1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 12 },
        { id: 'a2', kind: 'verse', label: 'Frase 2', startBeat: 12, endBeat: 24 },
        { id: 'b', kind: 'bridge', label: 'Midtdel', startBeat: 24, endBeat: 36 },
        { id: 'a3', kind: 'ending', label: 'Slutt', startBeat: 36, endBeat: 48 },
      ],
    })
    const hits = generateDrumTrack(d)
    const onGrid = (t: number) => Math.abs(((t - 1) % 3) - 0) < 1e-6 || Math.abs(((t - 1) % 3) - 3) < 1e-6
    const crashes = hits.filter((h) => h.p === CRASH).map((h) => h.t)
    expect(crashes.length).toBe(3)
    for (const t of crashes) expect(onGrid(t)).toBe(true)
    expect(crashes).toEqual([13, 25, 37]) // nearest barline to 12 / 24 / 36
    // The fill sits in the bar BEFORE the snapped boundary, never across it.
    for (const t of crashes) {
      const fillBar = hits.filter((h) => h.t >= t - 3 - 1e-6 && h.t < t)
      expect(fillBar.length).toBeGreaterThan(0)
      expect(fillBar.some((h) => Math.abs(h.t - (t - 0.5)) < 1e-6 && h.p === 38)).toBe(true)
    }
  })

  it('does not double up when two boundaries snap to the same bar', () => {
    const d = doc({
      totalBeats: 24,
      sections: [
        { id: 'a', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 7 },
        { id: 'b', kind: 'refrain', label: 'Refreng', startBeat: 7, endBeat: 9 },
        { id: 'c', kind: 'ending', label: 'Slutt', startBeat: 9, endBeat: 24 },
      ],
    })
    const crashes = generateDrumTrack(d).filter((h) => h.p === CRASH)
    expect(crashes.map((h) => h.t)).toEqual([8]) // 7 and 9 both snap to bar 8
  })

  it('is deterministic (pure)', () => {
    expect(generateDrumTrack(doc(), undefined, 96)).toEqual(generateDrumTrack(doc(), undefined, 96))
  })
})

describe('lanesUsed', () => {
  it('maps each hit to its lane index, folding aliases and deduping', () => {
    // 36 = kick (lane 0), 35 = kick alias (also 0), 38 = snare (1), 42 = hi-hat (2).
    const s = lanesUsed([
      { t: 0, p: 36 },
      { t: 1, p: 35 },
      { t: 2, p: 38 },
      { t: 3, p: 42 },
    ])
    expect(s).toEqual(new Set([0, 1, 2]))
  })

  it('ignores pitches outside the drawable lanes', () => {
    expect(lanesUsed([{ t: 0, p: 99 }])).toEqual(new Set())
  })

  it('reports the toms/cymbals a fuller groove reaches', () => {
    // 41 = low tom (lane 4), 49 = crash (7), 51 = ride (8).
    expect(lanesUsed([{ t: 0, p: 41 }, { t: 1, p: 49 }, { t: 2, p: 51 }])).toEqual(
      new Set([4, 7, 8]),
    )
  })
})

describe('hitsToEngineEvents', () => {
  it('maps hits 1:1 with nominal duration and default velocity', () => {
    const evs = hitsToEngineEvents([
      { t: 0, p: 36, v: 0.9 },
      { t: 1.5, p: 38 },
    ])
    expect(evs).toEqual([
      { beat: 0, pitch: 36, durBeats: 0.1, vel: 0.9, hand: 'R' },
      { beat: 1.5, pitch: 38, durBeats: 0.1, vel: 0.8, hand: 'R' },
    ])
  })
})
