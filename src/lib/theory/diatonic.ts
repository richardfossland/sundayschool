// ── Diatonic scales & triads (pure, no audio) ────────────────────────────────
//
// Scale building from whole/half-step patterns, the seven diatonic TRIADS with
// their Norwegian-convention function symbols (I ii iii IV V vi vii° in major,
// i ii° III iv v VI VII in natural minor), and reverse lookup: which degree a
// given chord is in a given key. Chord qualities use the same strings as
// lib/music.ts CHORD_INTERVALS ('' = major, 'm' = minor, 'dim' = diminished).

import { pitchClass } from '../music'

export type Mode = 'major' | 'minor'

export interface KeyRef {
  tonic: number // pitch class 0–11
  mode: Mode
}

// Whole/half-step patterns from the tonic: major = H H h H H H h, natural
// minor = H h H H h H H (as cumulative semitone offsets).
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11]
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10]

/** The seven scale-tone pitch classes of a key, tonic first. */
export function scalePitches(tonicPc: number, mode: Mode): number[] {
  const steps = mode === 'major' ? MAJOR_STEPS : MINOR_STEPS
  return steps.map((s) => pitchClass(tonicPc + s))
}

export interface DiatonicTriad {
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7
  /** Function symbol, e.g. 'I', 'ii', 'vii°'. */
  roman: string
  root: number // pitch class 0–11
  /** Matches lib/music.ts CHORD_INTERVALS keys: '' | 'm' | 'dim'. */
  quality: string
}

// Triad qualities per degree, from stacking scale thirds.
const MAJOR_TRIADS = ['', 'm', 'm', '', '', 'm', 'dim']
const MAJOR_ROMANS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
const MINOR_TRIADS = ['m', 'dim', '', 'm', 'm', '', '']
const MINOR_ROMANS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']

/** The seven diatonic triads of a key, in scale-degree order. */
export function diatonicTriads(tonicPc: number, mode: Mode): DiatonicTriad[] {
  const roots = scalePitches(tonicPc, mode)
  const qualities = mode === 'major' ? MAJOR_TRIADS : MINOR_TRIADS
  const romans = mode === 'major' ? MAJOR_ROMANS : MINOR_ROMANS
  return roots.map((root, i) => ({
    degree: (i + 1) as DiatonicTriad['degree'],
    roman: romans[i],
    root,
    quality: qualities[i],
  }))
}

// Chord-quality string → triad family, so `chordDegree` can match extended
// chords (C6, Cmaj7, Cadd9 are all major-family; Cm7/Cm9 minor-family; …).
const QUALITY_FAMILY: Record<string, string> = {
  '': '', maj7: '', maj9: '', '6': '', add9: '', '7': '', '9': '',
  m: 'm', m7: 'm', m9: 'm', m6: 'm',
  dim: 'dim', dim7: 'dim', m7b5: 'dim',
}

/**
 * Which diatonic degree a chord is in a key — or null when it isn't diatonic
 * (by root + triad family; a G7 matches the V of C major, an Ab does not).
 */
export function chordDegree(
  chord: { root: number; quality: string },
  key: KeyRef,
): DiatonicTriad | null {
  const family = QUALITY_FAMILY[chord.quality]
  if (family === undefined) return null
  return (
    diatonicTriads(key.tonic, key.mode).find(
      (t) => t.root === pitchClass(chord.root) && t.quality === family,
    ) ?? null
  )
}

// ── Chord voicings (for demos & ear training) ───────────────────────────────
// Semitone offsets from a root MIDI note, voiced naturally (the add9's 9th sits
// an octave up, unlike the pitch-class-only table in lib/music.ts). Only the
// qualities the school actually teaches/quizzes.
const CHORD_VOICINGS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  sus4: [0, 5, 7],
  add9: [0, 4, 7, 14],
}

/** Norwegian display labels for the taught chord qualities. */
export const QUALITY_LABELS: Record<string, string> = {
  '': 'Dur',
  m: 'Moll',
  '7': 'Septim (7)',
  maj7: 'Maj7',
  m7: 'Moll7',
  dim: 'Forminsket',
  sus4: 'Sus4',
  add9: 'Add9',
}

/** The qualities `chordPitches` can voice, in teaching order. */
export const VOICED_QUALITIES = Object.keys(CHORD_VOICINGS)

/** Actual MIDI pitches of a chord voiced from a root MIDI note. */
export function chordPitches(rootMidi: number, quality: string): number[] {
  const iv = CHORD_VOICINGS[quality] ?? CHORD_VOICINGS['']
  return iv.map((i) => rootMidi + i)
}
