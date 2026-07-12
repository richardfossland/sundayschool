import { describe, it, expect } from 'vitest'
import type { SongNote } from '@/types/song'
import type { SongSource } from '@/types/song-source'
import { chordPitchClasses, pitchClass } from '../music.ts'
import { voicingHint } from '../voicing-hints.ts'
import { validateSeedSong } from '../song/format.ts'
import { generatePianoArrangement, type ArrangementLevel } from './piano-arrangement.ts'
import { julSources } from '@/data/songs/sources/jul.ts'
import { norskeSources } from '@/data/songs/sources/norske.ts'

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

  it('rejects an invalid source with a readable error', () => {
    const badHand = { ...tiny, melody: [{ ...tiny.melody[0], h: 'L' as const }, ...tiny.melody.slice(1)] }
    expect(() => generatePianoArrangement(badHand, 1)).toThrow(/h må være 'R'/)

    const tooHigh = { ...tiny, melody: [{ ...tiny.melody[0], p: 90 }, ...tiny.melody.slice(1)] }
    expect(() => generatePianoArrangement(tooHigh, 1)).toThrow(/C3–C6/)

    const gappyChords = { ...tiny, chords: [{ t: 0, d: 2, r: 0, q: '' }, { t: 6, d: 2, r: 7, q: '7' }] }
    expect(() => generatePianoArrangement(gappyChords, 1)).toThrow(/akkordhull/)
  })
})
