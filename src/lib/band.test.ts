import { describe, it, expect } from 'vitest'
import type { SongDoc } from '@/types/song'
import type { InstrumentId } from './instruments'
import { bandTracks, applyBandMix, gainToDb, DEFAULT_BAND_GAIN } from './band'

// Band-modus assembles the accompaniment the app plays while the learner plays
// their own instrument. The invariants that matter: the default band is
// piano+bass+drums (no guitar); `exclude` drops exactly the learner's own
// instrument; guitar only appears when opted in; and assembly is deterministic.

/** Minimal doc factory — a 4/4 song with notes, chords and two sections. */
function doc(over: Partial<SongDoc> = {}): SongDoc {
  return {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats: 16,
    keySignature: 'C',
    sections: [
      { id: 'a', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 8 },
      { id: 'b', kind: 'refrain', label: 'Refreng', startBeat: 8, endBeat: 16 },
    ],
    notes: [
      { p: 60, t: 0, d: 1, h: 'R' },
      { p: 64, t: 1, d: 1, h: 'R' },
      { p: 48, t: 0, d: 2, h: 'L' },
    ],
    chords: [
      { t: 0, d: 4, r: 0, q: '' },
      { t: 4, d: 4, r: 7, q: '' },
      { t: 8, d: 4, r: 5, q: '' },
      { t: 12, d: 4, r: 0, q: '' },
    ],
    ...over,
  }
}

const instrumentsOf = (d = doc(), opts = { bpm: 90 }) =>
  bandTracks(d, opts).map((t) => t.instrument)

describe('bandTracks — default band', () => {
  it('is piano + bass + drums (no guitar) when nothing is excluded', () => {
    expect(instrumentsOf()).toEqual(['piano', 'bass', 'drums'])
  })

  it('gives each track a non-empty event list for a real song', () => {
    for (const track of bandTracks(doc(), { bpm: 90 })) {
      expect(track.events.length).toBeGreaterThan(0)
    }
  })

  it('starts each track at its balanced default level', () => {
    for (const track of bandTracks(doc(), { bpm: 90 })) {
      expect(track.volumeDb).toBeCloseTo(gainToDb(DEFAULT_BAND_GAIN[track.instrument]), 6)
    }
  })
})

describe('bandTracks — exclude (the learner plays their own instrument)', () => {
  const cases: { exclude: InstrumentId; rest: InstrumentId[] }[] = [
    { exclude: 'piano', rest: ['bass', 'drums'] }, // piano fag
    { exclude: 'bass', rest: ['piano', 'drums'] }, // bass fag
    { exclude: 'drums', rest: ['piano', 'bass'] }, // trommer fag
    { exclude: 'guitar', rest: ['piano', 'bass', 'drums'] }, // gitar fag
  ]

  for (const { exclude, rest } of cases) {
    it(`excludes '${exclude}' → band is ${rest.join('+')}`, () => {
      expect(instrumentsOf(doc(), { bpm: 90, exclude } as never)).toEqual(rest)
    })
  }

  it('never emits a track for the excluded instrument', () => {
    for (const exclude of ['piano', 'bass', 'drums', 'guitar'] as InstrumentId[]) {
      const has = bandTracks(doc(), { bpm: 90, exclude }).some((t) => t.instrument === exclude)
      expect(has).toBe(false)
    }
  })
})

describe('bandTracks — guitar is opt-in', () => {
  it('adds a guitar track only when a strum pattern is requested', () => {
    expect(instrumentsOf(doc(), { bpm: 90 })).not.toContain('guitar')
    const withGuitar = bandTracks(doc(), { bpm: 90, strumPatternId: 'folk' }).map((t) => t.instrument)
    expect(withGuitar).toEqual(['piano', 'bass', 'drums', 'guitar'])
  })

  it('falls back to the meter default pattern for an empty pattern id', () => {
    const withGuitar = bandTracks(doc(), { bpm: 90, strumPatternId: '' })
    const guitar = withGuitar.find((t) => t.instrument === 'guitar')
    expect(guitar).toBeDefined()
    expect(guitar!.events.length).toBeGreaterThan(0)
  })

  it('still honours exclude for guitar even when a pattern is given', () => {
    const tracks = bandTracks(doc(), { bpm: 90, exclude: 'guitar', strumPatternId: 'folk' })
    expect(tracks.map((t) => t.instrument)).toEqual(['piano', 'bass', 'drums'])
  })
})

describe('bandTracks — bass level', () => {
  it('defaults to level 2 and honours an explicit level', () => {
    const lvl1 = bandTracks(doc(), { bpm: 90, bassLevel: 1 }).find((t) => t.instrument === 'bass')!
    const dflt = bandTracks(doc(), { bpm: 90 }).find((t) => t.instrument === 'bass')!
    const lvl2 = bandTracks(doc(), { bpm: 90, bassLevel: 2 }).find((t) => t.instrument === 'bass')!
    // Level 1 is one held root per chord (4 chords → 4 events); level 2 subdivides.
    expect(lvl1.events.length).toBe(4)
    expect(dflt.events).toEqual(lvl2.events)
    expect(lvl2.events.length).toBeGreaterThan(lvl1.events.length)
  })
})

describe('bandTracks — deterministic', () => {
  it('yields identical tracks for identical input', () => {
    expect(bandTracks(doc(), { bpm: 90, exclude: 'drums' })).toEqual(
      bandTracks(doc(), { bpm: 90, exclude: 'drums' }),
    )
  })
})

describe('gainToDb', () => {
  it('maps unity to 0 dB and floors silence at −60', () => {
    expect(gainToDb(1)).toBeCloseTo(0, 6)
    expect(gainToDb(0.5)).toBeCloseTo(-6.0206, 3)
    expect(gainToDb(0)).toBe(-60)
  })
})

describe('applyBandMix', () => {
  it('re-applies only the instruments the learner has adjusted', () => {
    const calls: { id: InstrumentId; db: number }[] = []
    const fake = { setTrackVolume: (id: InstrumentId, db: number) => calls.push({ id, db }) }
    applyBandMix(fake as never, { drums: 0.4, bass: 1 })
    expect(calls).toEqual([
      { id: 'bass', db: gainToDb(1) },
      { id: 'drums', db: gainToDb(0.4) },
    ])
  })

  it('is a no-op for an empty mix', () => {
    let called = 0
    const fake = { setTrackVolume: () => (called += 1) }
    applyBandMix(fake as never, {})
    expect(called).toBe(0)
  })
})
