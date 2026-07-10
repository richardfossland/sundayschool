// ── Key-aware enharmonic spelling (pure, no audio) ──────────────────────────
//
// A SongDoc carries a `keySignature` (e.g. 'Eb' major, 'g' minor — lowercase for
// minor). Notation must spell pitches consistently with that key: in Eb major
// MIDI 68 is Ab, never G#. This module turns MIDI/pitch-class + key into a
// (letter, accidental, octave) triple that VexFlow and chord labels can render.

import { pitchClass } from './music'

export type Accidental = '' | '#' | 'b' | '##' | 'bb'

export interface KeyAccidentals {
  count: number // number of sharps/flats in the signature (0–7)
  type: '#' | 'b' | null // null = no accidentals (C major / A minor)
}

export interface Spelling {
  letter: string // 'A'..'G'
  accidental: Accidental
  octave: number // scientific pitch of the LETTER (Cb4 sounds B3 but stays octave 4)
}

// Natural pitch class of each letter.
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

// Order accidentals appear in a key signature.
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

// Key signature (count + type) per key name. Keyed by "Letter+accidental",
// mode chosen by the caller. Covers all common keys up to 7 accidentals.
const MAJOR_SIG: Record<string, KeyAccidentals> = {
  C: { count: 0, type: null },
  G: { count: 1, type: '#' }, D: { count: 2, type: '#' }, A: { count: 3, type: '#' },
  E: { count: 4, type: '#' }, B: { count: 5, type: '#' }, 'F#': { count: 6, type: '#' },
  'C#': { count: 7, type: '#' },
  F: { count: 1, type: 'b' }, Bb: { count: 2, type: 'b' }, Eb: { count: 3, type: 'b' },
  Ab: { count: 4, type: 'b' }, Db: { count: 5, type: 'b' }, Gb: { count: 6, type: 'b' },
  Cb: { count: 7, type: 'b' },
}

const MINOR_SIG: Record<string, KeyAccidentals> = {
  A: { count: 0, type: null },
  E: { count: 1, type: '#' }, B: { count: 2, type: '#' }, 'F#': { count: 3, type: '#' },
  'C#': { count: 4, type: '#' }, 'G#': { count: 5, type: '#' }, 'D#': { count: 6, type: '#' },
  'A#': { count: 7, type: '#' },
  D: { count: 1, type: 'b' }, G: { count: 2, type: 'b' }, C: { count: 3, type: 'b' },
  F: { count: 4, type: 'b' }, Bb: { count: 5, type: 'b' }, Eb: { count: 6, type: 'b' },
  Ab: { count: 7, type: 'b' },
}

export interface ParsedKey {
  letter: string // 'A'..'G'
  accidental: '' | '#' | 'b'
  mode: 'major' | 'minor' // uppercase name = major, lowercase = minor
  tonic: number // tonic pitch class 0–11
}

/** Parse a key-signature string ('Eb', 'g', 'f#') into letter/accidental/mode/tonic. */
export function parseKeySignature(keySignature: string): ParsedKey {
  const s = keySignature.trim() || 'C'
  const first = s[0]
  const mode: 'major' | 'minor' = first === first.toLowerCase() && first.toUpperCase() !== first ? 'minor' : 'major'
  const letter = first.toUpperCase()
  const rest = s.slice(1)
  const accidental: '' | '#' | 'b' = rest === '#' ? '#' : rest === 'b' ? 'b' : ''
  const tonic = pitchClass(LETTER_PC[letter] + accOffset(accidental))
  return { letter, accidental, mode, tonic }
}

/** Sharps/flats of a key signature. Unknown keys fall back to C major (0). */
export function keyAccidentals(keySignature: string): KeyAccidentals {
  const { letter, accidental, mode } = parseKeySignature(keySignature)
  const name = letter + accidental
  const table = mode === 'major' ? MAJOR_SIG : MINOR_SIG
  return table[name] ?? { count: 0, type: null }
}

// Semitone value of an accidental.
function accOffset(a: Accidental): number {
  return a === '#' ? 1 : a === '##' ? 2 : a === 'b' ? -1 : a === 'bb' ? -2 : 0
}

// Raise an accidental by a semitone (used for the minor leading tone).
function raiseAcc(a: Accidental): Accidental {
  switch (a) {
    case 'bb': return 'b'
    case 'b': return ''
    case '': return '#'
    case '#': return '##'
    default: return '##'
  }
}

// Letter → its accidental in a given key signature.
function letterAccidentals(sig: KeyAccidentals): Record<string, '' | '#' | 'b'> {
  const map: Record<string, '' | '#' | 'b'> = { C: '', D: '', E: '', F: '', G: '', A: '', B: '' }
  if (sig.type === '#') for (let i = 0; i < sig.count; i++) map[SHARP_ORDER[i]] = '#'
  if (sig.type === 'b') for (let i = 0; i < sig.count; i++) map[FLAT_ORDER[i]] = 'b'
  return map
}

// Preference tables for chromatic (non-diatonic) tones.
const SHARP_TABLE: [string, Accidental][] = [
  ['C', ''], ['C', '#'], ['D', ''], ['D', '#'], ['E', ''], ['F', ''],
  ['F', '#'], ['G', ''], ['G', '#'], ['A', ''], ['A', '#'], ['B', ''],
]
const FLAT_TABLE: [string, Accidental][] = [
  ['C', ''], ['D', 'b'], ['D', ''], ['E', 'b'], ['E', ''], ['F', ''],
  ['G', 'b'], ['G', ''], ['A', 'b'], ['A', ''], ['B', 'b'], ['B', ''],
]

// Build the 12-entry pitch-class → (letter, accidental) map for a key.
function buildSpellingMap(keySignature: string): Record<number, { letter: string; accidental: Accidental }> {
  const parsed = parseKeySignature(keySignature)
  const sig = keyAccidentals(keySignature)
  const map: Record<number, { letter: string; accidental: Accidental }> = {}

  // 1) The seven diatonic notes get the key signature's spelling.
  const la = letterAccidentals(sig)
  for (const letter of LETTERS) {
    const acc = la[letter]
    map[pitchClass(LETTER_PC[letter] + accOffset(acc))] = { letter, accidental: acc }
  }

  // 2) Chromatic tones use a simple flat/sharp preference. In C major (null)
  //    prefer sharps for rising semitones, except Bb.
  const table = sig.type === 'b' ? FLAT_TABLE : SHARP_TABLE
  for (let pc = 0; pc < 12; pc++) {
    if (map[pc]) continue
    if (sig.type === null && pc === 10) {
      map[pc] = { letter: 'B', accidental: 'b' } // C major: Bb, not A#
    } else {
      const [letter, accidental] = table[pc]
      map[pc] = { letter, accidental }
    }
  }

  // 3) Minor: spell the raised 7th as a proper leading tone (with a sharp),
  //    e.g. g minor → F#, c minor → B natural.
  if (parsed.mode === 'minor') {
    const seventhPc = pitchClass(parsed.tonic + 10) // natural 7th degree
    const seventh = map[seventhPc]
    if (seventh) {
      const ltPc = pitchClass(parsed.tonic + 11)
      map[ltPc] = { letter: seventh.letter, accidental: raiseAcc(seventh.accidental) }
    }
  }

  return map
}

/** (letter, accidental) for a pitch class, spelled consistently with the key. */
export function spellPitchClass(pc: number, keySignature: string): { letter: string; accidental: Accidental } {
  return buildSpellingMap(keySignature)[pitchClass(pc)]
}

/** Full spelling (with octave) of a MIDI note in a key. */
export function spellPitch(midi: number, keySignature: string): Spelling {
  const { letter, accidental } = spellPitchClass(pitchClass(midi), keySignature)
  // Octave follows the LETTER's natural pitch, so Cb/B# stay on their line.
  const naturalMidi = midi - accOffset(accidental)
  const octave = Math.floor(naturalMidi / 12) - 1
  return { letter, accidental, octave }
}

/** VexFlow key string for a MIDI note in a key, e.g. 68 in Eb → "ab/4". */
export function vexKey(midi: number, keySignature: string): string {
  const { letter, accidental, octave } = spellPitch(midi, keySignature)
  return `${letter.toLowerCase()}${accidental}/${octave}`
}

/** Pretty chord symbol with key-correct enharmonics (in Eb: "Ab", not "G#"). */
export function chordSymbol(r: number, q: string, keySignature: string, b?: number): string {
  const root = spellPitchClass(r, keySignature)
  const base = `${root.letter}${root.accidental}${q}`
  if (b === undefined || b === null) return base
  const bass = spellPitchClass(b, keySignature)
  return `${base}/${bass.letter}${bass.accidental}`
}

// Canonical key names per tonic pitch class, one conventional spelling each.
const MAJOR_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const MINOR_NAMES = ['c', 'c#', 'd', 'eb', 'e', 'f', 'f#', 'g', 'g#', 'a', 'bb', 'b']

/** Pretty key-signature name for a tonic pitch class + mode (minor = lowercase). */
export function keyNameForTonic(pc: number, mode: 'major' | 'minor'): string {
  return (mode === 'major' ? MAJOR_NAMES : MINOR_NAMES)[pitchClass(pc)]
}
