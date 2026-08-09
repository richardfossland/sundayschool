import { describe, it, expect } from 'vitest'
import type { SongNote } from '@/types/song'
import type { SongSource } from '@/types/song-source'
import { chordPitchClasses, pitchClass } from '../music.ts'
import { voicingHint } from '../voicing-hints.ts'
import { validateSeedSong } from '../song/format.ts'
import { generatePianoArrangement, type ArrangementLevel } from './piano-arrangement.ts'
import { julSources } from '@/data/songs/sources/jul.ts'
import { norskeSources } from '@/data/songs/sources/norske.ts'
import { songSources } from '@/data/songs/sources/index.ts'

// ── Arranger: contract + register/voice-leading invariants ───────────────────
// The generator's promises are structural: deterministic output, the source
// melody untouched as the soprano, the alto always under the soprano and
// above C4, both hands inside their registers, and no silent gap > 2 beats.
// The full musical-quality suite in src/data/songs.test.ts re-checks every
// generated arrangement as part of the seed library (acceptance filter); the
// tests here pin the arranger-specific behaviour, including on a synthetic
// minimal source.

const joy = julSources.find((s) => s.slug === 'joy-to-the-world')!
const nun = norskeSources.find((s) => s.slug === 'naa-takker-alle-gud')!

/** Minimal single-level source for the labelling edge cases. */
const tiny: SongSource = {
  slug: 'tiny-test-song',
  title: 'Tiny Test Song',
  subtitle: null,
  tradition: 'salme',
  original_key: 0,
  mode: 'major',
  default_bpm: 90,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 8,
  keySignature: 'C',
  sections: [{ id: 'v1', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 8 }],
  melody: [
    { p: 67, t: 0, d: 2, h: 'R' },
    { p: 64, t: 2, d: 2, h: 'R' },
    { p: 65, t: 4, d: 2, h: 'R' },
    { p: 67, t: 6, d: 2, h: 'R' },
  ],
  chords: [
    { t: 0, d: 4, r: 0, q: '' },
    { t: 4, d: 2, r: 5, q: '' },
    { t: 6, d: 2, r: 7, q: '7' },
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Trad.', role: 'komponist', deathYear: null }],
    sources: ['Testkilde'],
    verifiedAt: '2026-07-12',
  },
  tags: ['test'],
  levels: [1],
}

const LEVELS: ArrangementLevel[] = [1, 2, 3]
const EPS = 1e-6

/** The soprano = the highest right-hand note at each onset. */
function soprano(notes: SongNote[]): SongNote[] {
  const byOnset = new Map<number, SongNote>()
  for (const n of notes) {
    if (n.h !== 'R') continue
    const cur = byOnset.get(n.t)
    if (!cur || n.p > cur.p) byOnset.set(n.t, n)
  }
  return [...byOnset.values()].sort((a, b) => a.t - b.t)
}

function maxGap(notes: SongNote[]): number {
  const hs = [...notes].sort((a, b) => a.t - b.t)
  let reach = hs[0].t + hs[0].d
  let gap = hs[0].t
  for (const n of hs) {
    gap = Math.max(gap, n.t - reach)
    reach = Math.max(reach, n.t + n.d)
  }
  return gap
}

describe('generatePianoArrangement', () => {
  it('is deterministic (same source + level → deeply equal output)', () => {
    for (const level of LEVELS) {
      expect(generatePianoArrangement(nun, level)).toEqual(generatePianoArrangement(nun, level))
    }
    expect(generatePianoArrangement(joy, 1)).toEqual(generatePianoArrangement(joy, 1))
    expect(generatePianoArrangement(joy, 3)).toEqual(generatePianoArrangement(joy, 3))
  })

  it('every generated arrangement passes validateSeedSong', () => {
    for (const source of [joy, nun]) {
      for (const level of source.levels) {
        expect(() => validateSeedSong(generatePianoArrangement(source, level))).not.toThrow()
      }
    }
  })

  it('keeps the source melody untouched as the soprano line at every level', () => {
    for (const source of [joy, nun]) {
      for (const level of source.levels) {
        const sop = soprano(generatePianoArrangement(source, level).doc.notes)
        const mel = [...source.melody].sort((a, b) => a.t - b.t)
        expect(sop.map((n) => [n.p, n.t, n.d])).toEqual(mel.map((n) => [n.p, n.t, n.d]))
      }
    }
  })

  it('maps level → slug/difficulty/style/label', () => {
    const enkel = generatePianoArrangement(joy, 1)
    expect(enkel.slug).toBe('joy-to-the-world')
    expect(enkel.work_slug).toBe('joy-to-the-world')
    expect(enkel.difficulty).toBe(1)
    expect(enkel.arrangement_style).toBe('enkel')
    expect(enkel.variant_label).toBe('Enkel') // the work has several variants

    const gospel = generatePianoArrangement(joy, 3)
    expect(gospel.slug).toBe('joy-to-the-world-gospel')
    expect(gospel.work_slug).toBe('joy-to-the-world')
    expect(gospel.difficulty).toBe(3)
    expect(gospel.arrangement_style).toBe('gospel')
    expect(gospel.variant_label).toBe('Gospel')

    const firstemmig = generatePianoArrangement(nun, 2)
    expect(firstemmig.slug).toBe('naa-takker-alle-gud-firstemmig')
    expect(firstemmig.variant_label).toBe('Firstemmig')

    expect(generatePianoArrangement(joy, 3).rights.notes).toContain('Generert Gospel-sats')
  })

  it('leaves variant_label null for a single-level work', () => {
    const only = generatePianoArrangement(tiny, 1)
    expect(only.variant_label).toBeNull()
    expect(only.slug).toBe('tiny-test-song')
    expect(() => validateSeedSong(only)).not.toThrow()
  })

  it('keeps the left hand inside its register (F2–C4; gospel up to E4)', () => {
    for (const source of [joy, nun, tiny]) {
      for (const level of LEVELS) {
        const high = level === 3 ? 64 : 60
        for (const n of generatePianoArrangement(source, level).doc.notes) {
          if (n.h !== 'L') continue
          expect(n.p).toBeGreaterThanOrEqual(41)
          expect(n.p).toBeLessThanOrEqual(high)
        }
      }
    }
  })

  it('never leaves either hand silent for more than 2 beats', () => {
    for (const source of [joy, nun, tiny]) {
      for (const level of LEVELS) {
        const notes = generatePianoArrangement(source, level).doc.notes
        for (const hand of ['L', 'R'] as const) {
          const hs = notes.filter((n) => n.h === hand)
          expect(hs.length).toBeGreaterThan(0)
          expect(maxGap(hs)).toBeLessThanOrEqual(2 + EPS)
        }
      }
    }
  })

  it('firstemmig: the alto is a chord tone strictly below the soprano, ≥ C4, leaps ≤ a fourth', () => {
    const arr = generatePianoArrangement(nun, 2)
    const sopByOnset = new Map(soprano(arr.doc.notes).map((n) => [n.t, n.p]))
    const altos = arr.doc.notes
      .filter((n) => n.h === 'R' && n.p !== sopByOnset.get(n.t))
      .sort((a, b) => a.t - b.t)
    expect(altos.length).toBeGreaterThan(10) // a real second voice, not a token
    let prev: number | null = null
    for (const a of altos) {
      const sop = sopByOnset.get(a.t)
      expect(sop).toBeDefined() // alto onsets coincide with melody onsets
      expect(a.p).toBeLessThan(sop!)
      expect(a.p).toBeGreaterThanOrEqual(60)
      const chord = arr.doc.chords.find((c) => c.t <= a.t + EPS && a.t < c.t + c.d - EPS)!
      expect(chordPitchClasses(chord.r, chord.q)).toContain(pitchClass(a.p))
      if (prev !== null) expect(Math.abs(a.p - prev)).toBeLessThanOrEqual(5)
      prev = a.p
    }
  })

  it('gospel: LH plays the level-4 voicing pitch classes; fills sit under the melody and ≥ D4', () => {
    const arr = generatePianoArrangement(joy, 3)
    for (const c of arr.doc.chords) {
      const lh = arr.doc.notes.filter((n) => n.h === 'L' && Math.abs(n.t - c.t) < EPS)
      expect(lh.length).toBeGreaterThan(0)
      const hintPcs = new Set(voicingHint(c, 4).map(pitchClass))
      for (const n of lh) {
        expect(hintPcs.has(pitchClass(n.p))).toBe(true)
        expect(n.d).toBeCloseTo(c.d, 6) // one voicing held for the chord
      }
    }
    const sopByOnset = new Map(soprano(arr.doc.notes).map((n) => [n.t, n.p]))
    const fills = arr.doc.notes.filter((n) => n.h === 'R' && n.p !== sopByOnset.get(n.t))
    expect(fills.length).toBeGreaterThan(0) // joy has long notes on chord changes
    for (const f of fills) {
      expect(f.p).toBeGreaterThanOrEqual(62)
      expect(f.p).toBeLessThan(sopByOnset.get(f.t)!)
    }
  })

  // ── Regressions: confirmed review findings (each one was measured) ──────────
  // Every case below produced wrong notes in the generated library before the
  // fix, so they assert the RULE across the whole source library, not one song.

  /** Left-hand notes sounding during a chord's span. */
  const lhDuring = (notes: SongNote[], t: number, d: number) =>
    notes.filter((n) => n.h === 'L' && n.t >= t - EPS && n.t < t + d - EPS)

  /** The melody notes sounding while `n` is held (melody is monophonic). */
  const melodyUnder = (melody: SongNote[], n: SongNote) =>
    melody.filter((m) => m.t + EPS >= n.t && m.t < n.t + n.d - EPS)

  it('slash chords: the written bass is the lowest LH note, thirds/fifths come from the ROOT', () => {
    // C/E must sound C–E–G tones over an E bass — never B (a fifth above the E)
    // or G# (a third above it), the bug this pins.
    const slash: SongSource = {
      ...tiny,
      slug: 'slash-test-song',
      chords: [
        { t: 0, d: 4, r: 0, q: '', b: 4 }, // C/E
        { t: 4, d: 4, r: 7, q: '', b: 11 }, // G/B
      ],
      levels: [1, 2],
    }
    for (const level of [1, 2] as const) {
      const arr = generatePianoArrangement(slash, level)
      for (const c of arr.doc.chords) {
        const lh = lhDuring(arr.doc.notes, c.t, c.d)
        expect(lh.length).toBeGreaterThan(0)
        const allowed = new Set(chordPitchClasses(c.r, c.q)) // C/E → {C, E, G}
        for (const n of lh) expect(allowed.has(pitchClass(n.p))).toBe(true)
        const lowest = Math.min(...lh.map((n) => n.p))
        expect(pitchClass(lowest)).toBe(c.b) // the slash bass stays in the bass
      }
    }

    // …and across the whole library: no LH note outside the chord's own tones.
    for (const src of songSources) {
      for (const level of src.levels) {
        if (level === 3) continue // gospel adds a colour 9th, checked separately
        const arr = generatePianoArrangement(src, level)
        for (const c of arr.doc.chords) {
          const allowed = new Set([...chordPitchClasses(c.r, c.q), pitchClass(c.b ?? c.r)])
          for (const n of lhDuring(arr.doc.notes, c.t, c.d)) {
            expect(allowed.has(pitchClass(n.p))).toBe(true)
          }
        }
      }
    }
  })

  it('the left hand rests through the pickup (opptakt) at every level', () => {
    for (const src of songSources) {
      if (src.pickupBeats <= 0) continue
      for (const level of src.levels) {
        const arr = generatePianoArrangement(src, level)
        for (const n of arr.doc.notes) {
          if (n.h === 'L') expect(n.t).toBeGreaterThanOrEqual(src.pickupBeats - EPS)
        }
        // …and the accompaniment starts exactly on the first downbeat.
        const firstLh = Math.min(...arr.doc.notes.filter((n) => n.h === 'L').map((n) => n.t))
        expect(firstLh).toBeCloseTo(src.pickupBeats, 6)
      }
    }
  })

  it('gospel: the LH voicing keeps a minor third between simultaneous voices', () => {
    for (const src of songSources) {
      if (!src.levels.includes(3)) continue
      const arr = generatePianoArrangement(src, 3)
      for (const c of arr.doc.chords) {
        // The LH rests through the pickup, so a chord may be (partly) silent.
        const start = Math.max(c.t, src.pickupBeats)
        const dur = c.t + c.d - start
        if (dur <= EPS) continue
        const ps = lhDuring(arr.doc.notes, start, dur)
          .map((n) => n.p)
          .sort((a, b) => a - b)
        expect(ps.length).toBeGreaterThan(0)
        for (let i = 1; i < ps.length; i++) expect(ps[i] - ps[i - 1]).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('gospel: fills clear the LH register and keep a minor third to the melody', () => {
    for (const src of songSources) {
      if (!src.levels.includes(3)) continue
      const arr = generatePianoArrangement(src, 3)
      const sopByOnset = new Map(soprano(arr.doc.notes).map((n) => [n.t, n.p]))
      const fills = arr.doc.notes.filter((n) => n.h === 'R' && n.p !== sopByOnset.get(n.t))
      for (const f of fills) {
        expect(f.p).toBeGreaterThanOrEqual(65) // above the whole gospel LH register
        for (const m of melodyUnder(arr.doc.notes.filter((n) => n.h === 'R' && n.p === sopByOnset.get(n.t)), f)) {
          expect(m.p - f.p).toBeGreaterThanOrEqual(3)
        }
        for (const n of lhDuring(arr.doc.notes, f.t, f.d)) expect(f.p).toBeGreaterThan(n.p)
      }
    }
  })

  it('sus chords never get a major third (fills use the chord\'s own tones)', () => {
    const sus: SongSource = {
      ...tiny,
      slug: 'sus-test-song',
      melody: [
        { p: 72, t: 0, d: 4, h: 'R' }, // long enough to trigger a fill, high enough to allow one
        { p: 72, t: 4, d: 4, h: 'R' },
      ],
      chords: [
        { t: 0, d: 4, r: 0, q: '7sus4' }, // C7sus4 → C F G Bb, no E
        { t: 4, d: 4, r: 0, q: 'sus2' }, // Csus2 → C D G, no E
      ],
      levels: [3],
    }
    const arr = generatePianoArrangement(sus, 3)
    const sopByOnset = new Map(soprano(arr.doc.notes).map((n) => [n.t, n.p]))
    const fills = arr.doc.notes.filter((n) => n.h === 'R' && n.p !== sopByOnset.get(n.t))
    expect(fills.length).toBeGreaterThan(0)
    for (const f of fills) {
      const chord = arr.doc.chords.find((c) => Math.abs(c.t - f.t) < EPS)!
      const allowed = new Set([...chordPitchClasses(chord.r, chord.q), pitchClass(chord.r + 2)])
      expect(allowed.has(pitchClass(f.p))).toBe(true)
      expect(pitchClass(f.p)).not.toBe(4) // E — the third a sus chord does not have
    }
  })

  it('firstemmig: the alto never crowds or tops the soprano, anywhere in the library', () => {
    for (const src of songSources) {
      if (!src.levels.includes(2)) continue
      const arr = generatePianoArrangement(src, 2)
      const sopByOnset = new Map(soprano(arr.doc.notes).map((n) => [n.t, n.p]))
      const melody = arr.doc.notes.filter((n) => n.h === 'R' && n.p === sopByOnset.get(n.t))
      const altos = arr.doc.notes
        .filter((n) => n.h === 'R' && n.p !== sopByOnset.get(n.t))
        .sort((a, b) => a.t - b.t)
      let prev: number | null = null
      for (const a of altos) {
        expect(a.p).toBeGreaterThanOrEqual(60) // floor C4
        // Holds through later melody notes too — a held alto must stay under.
        for (const m of melodyUnder(melody, a)) {
          expect(m.p - a.p).toBeGreaterThanOrEqual(3)
        }
        const chord = arr.doc.chords.find((c) => c.t <= a.t + EPS && a.t < c.t + c.d - EPS)!
        expect(chordPitchClasses(chord.r, chord.q)).toContain(pitchClass(a.p))
        if (prev !== null) expect(Math.abs(a.p - prev)).toBeLessThanOrEqual(5)
        prev = a.p
      }
    }
  })

  it('rejects an invalid source with a readable error', () => {
    const badHand = { ...tiny, melody: [{ ...tiny.melody[0], h: 'L' as const }, ...tiny.melody.slice(1)] }
    expect(() => generatePianoArrangement(badHand, 1)).toThrow(/h må være 'R'/)

    const tooHigh = { ...tiny, melody: [{ ...tiny.melody[0], p: 90 }, ...tiny.melody.slice(1)] }
    expect(() => generatePianoArrangement(tooHigh, 1)).toThrow(/C3–C6/)

    const gappyChords = { ...tiny, chords: [{ t: 0, d: 2, r: 0, q: '' }, { t: 6, d: 2, r: 7, q: '7' }] }
    expect(() => generatePianoArrangement(gappyChords, 1)).toThrow(/akkordhull/)
  })
})
