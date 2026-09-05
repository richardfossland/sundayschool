// ── Key-aware enharmonic spelling (pure, no audio) ──────────────────────────
//
// A SongDoc carries a `keySignature` (e.g. 'Eb' major, 'g' minor — lowercase for
// minor). Notation must spell pitches consistently with that key: in Eb major
// MIDI 68 is Ab, never G#. This module turns MIDI/pitch-class + key into a
// (letter, accidental, octave) triple that VexFlow and chord labels can render.

// Eksplisitt .ts-endelse: fila er i seed-scriptets import-graf (Node
// type-stripping krever fulle stier — samme krav som i src/data/songs/).
import { pitchClass, chordPitchClasses } from './music.ts'

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

// Built maps are pure functions of the key name, and the planner asks for one
// per notated note — memoise instead of rebuilding 12 entries each time.
const keyMapCache = new Map<string, Record<number, { letter: string; accidental: Accidental }>>()

function buildSpellingMap(keySignature: string): Record<number, { letter: string; accidental: Accidental }> {
  let cached = keyMapCache.get(keySignature)
  if (!cached) {
    cached = computeSpellingMap(keySignature)
    keyMapCache.set(keySignature, cached)
  }
  return cached
}

// Build the 12-entry pitch-class → (letter, accidental) map for a key.
function computeSpellingMap(keySignature: string): Record<number, { letter: string; accidental: Accidental }> {
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

// ── Chord context ───────────────────────────────────────────────────────────
//
// The key signature alone cannot spell an altered chord tone. A D7 in F major
// wants f#, but F major's chromatic table only knows "pitch class 6 = gb"; an
// Eb-major Caug wants g#, yet pitch class 8 is diatonic Ab. Both are read off
// the CHORD, not the key: a chord's third/fifth/seventh is stacked in thirds
// from the root, so its LETTER is fixed (root letter + 2/+4/+6) and only the
// accidental is free. Given the chord at a note's onset we therefore spell the
// chord's own tones from the chord and everything else from the key.

/** The chord sounding at a note's onset: root pitch class + quality. */
export interface ChordContext {
  r: number // root pitch class 0–11
  q: string // quality, same vocabulary as SongChord.q
}

/** Letter steps from the root's letter for every interval of a quality — the
 * stacked-third degree of each tone, positionally parallel to CHORD_INTERVALS
 * in lib/music (1=0, 3=2, 5=4, 7=6, 9=1, 4th=3, 6th=5). Exported only so
 * spelling.test.ts can pin the two tables to the same keys and the same
 * lengths; neither may then drift alone. */
export const CHORD_DEGREES: Record<string, number[]> = {
  '': [0, 2, 4],
  m: [0, 2, 4],
  '7': [0, 2, 4, 6],
  maj7: [0, 2, 4, 6],
  m7: [0, 2, 4, 6],
  m7b5: [0, 2, 4, 6],
  dim: [0, 2, 4],
  dim7: [0, 2, 4, 6],
  sus4: [0, 3, 4],
  sus2: [0, 1, 4],
  '6': [0, 2, 4, 5],
  m6: [0, 2, 4, 5],
  '9': [0, 2, 4, 6, 1],
  m9: [0, 2, 4, 6, 1],
  maj9: [0, 2, 4, 6, 1],
  add9: [0, 2, 4, 1],
  '7sus4': [0, 3, 4, 6],
  '5': [0, 4],
  aug: [0, 2, 4],
}

// Semitone deviation from the letter's natural pitch → accidental. Anything
// outside ±2 has no notehead (undefined), and makes the whole chord fall back
// to the key.
function accForDelta(delta: number): Accidental | undefined {
  switch (delta) {
    case -2: return 'bb'
    case -1: return 'b'
    case 0: return ''
    case 1: return '#'
    case 2: return '##'
    default: return undefined
  }
}

// How expensive a spelled tone is to READ, which is not how many accidentals it
// carries but how many the engraver must PRINT: in Gb major, cb–eb–gb prints
// nothing while the same three sounds as b–d#–f# print three. Counting absolute
// accidentals instead would respell the IV chord of every flat key.
//
// A double accidental on a NOTEHEAD costs the same as a single — b–d#–f× is the
// ordinary spelling of VI+ in D major, and pricing the × higher makes the same
// augmented triad flip to cb–eb–g in some transpositions and not others, right
// next to the dominant it shares a root with. In the chord's NAME it is a
// different matter: no chord strip should ever read "F##dim", so the root pays
// dearly and the chord respells around a plain letter instead.
function printCost(letter: string, a: Accidental, la: Record<string, '' | '#' | 'b'>, isRoot: boolean): number {
  const isDouble = a === '##' || a === 'bb'
  if (isRoot && isDouble) return 6
  return a === la[letter] ? 0 : 1
}

// The candidate spellings of one pitch class, cheapest letters first: the
// natural letter and its two neighbours, skipping anything past a double.
function rootCandidates(pc: number): { idx: number; letter: string; accidental: Accidental }[] {
  const out: { idx: number; letter: string; accidental: Accidental }[] = []
  LETTERS.forEach((letter, idx) => {
    const accidental = accForDelta(centeredDelta(pc, LETTER_PC[letter]))
    if (accidental !== undefined) out.push({ idx, letter, accidental })
  })
  return out
}

// Signed semitone distance from a letter's natural pitch to a target pitch
// class, taken the short way round: 0 → 11 is −1 (Cb), not +11.
function centeredDelta(target: number, natural: number): number {
  return ((pitchClass(target) - pitchClass(natural) + 18) % 12) - 6
}

/**
 * Spell every tone of a chord as a stack of thirds from its root, or null when
 * the chord has no readable spelling at all (some tone would need a triple
 * accidental — then the key's own map stays in charge).
 *
 * The root's LETTER is chosen, not assumed: pitch class 8 under a C-major key
 * signature spells g#, but a bVI triad there is Ab–C–Eb, and spelling it from
 * g# would turn its diatonic C and Eb into b# and d#. So every enharmonic root
 * is scored by what it costs the whole chord, and ties go to the key's own
 * spelling of the root — which is what keeps C#7 in B major as c#–e#–g#–b
 * rather than the equally cheap db–f–ab–cb.
 */
function chordSpellingMap(
  chord: ChordContext,
  keySignature: string,
): Record<number, { letter: string; accidental: Accidental }> | null {
  const pcs = chordPitchClasses(chord.r, chord.q)
  const degrees = CHORD_DEGREES[chord.q] ?? CHORD_DEGREES['']
  const keyRoot = buildSpellingMap(keySignature)[pitchClass(chord.r)]
  const la = letterAccidentals(keyAccidentals(keySignature))

  let best: Record<number, { letter: string; accidental: Accidental }> | null = null
  let bestCost = Infinity

  for (const root of rootCandidates(chord.r)) {
    const rootIdx = root.idx
    const map: Record<number, { letter: string; accidental: Accidental }> = {}
    let cost = 0
    let ok = true
    for (let i = 0; i < pcs.length && i < degrees.length; i++) {
      const letter = LETTERS[(rootIdx + degrees[i]) % 7]
      const accidental = accForDelta(centeredDelta(pcs[i], LETTER_PC[letter]))
      if (accidental === undefined) {
        ok = false
        break
      }
      cost += printCost(letter, accidental, la, degrees[i] === 0)
      map[pcs[i]] = { letter, accidental }
    }
    if (!ok) continue
    // Strictly cheaper wins; on a tie the first candidate stands, so seed the
    // race with the key's own root spelling by giving it a hair's discount.
    const isKeyRoot = root.letter === keyRoot.letter && root.accidental === keyRoot.accidental
    const score = cost - (isKeyRoot ? 0.5 : 0)
    if (score < bestCost) {
      bestCost = score
      best = map
    }
  }
  return best
}

// Chord maps are looked up once per note; the corpus reuses a handful of
// (key, chord) pairs thousands of times, so memoise both layers.
const chordMapCache = new Map<string, Record<number, { letter: string; accidental: Accidental }> | null>()

function chordMapFor(keySignature: string, chord: ChordContext) {
  const ck = `${keySignature}|${pitchClass(chord.r)}|${chord.q}`
  let map = chordMapCache.get(ck)
  if (map === undefined) {
    map = chordSpellingMap(chord, keySignature)
    chordMapCache.set(ck, map)
  }
  return map
}

/**
 * (letter, accidental) for a pitch class, spelled consistently with the key.
 * With a `chord` the chord's own tones are spelled from the chord instead —
 * everything else, chord or no chord, still follows the key signature.
 */
export function spellPitchClass(
  pc: number,
  keySignature: string,
  chord?: ChordContext | null,
): { letter: string; accidental: Accidental } {
  const p = pitchClass(pc)
  const inChord = chord ? chordMapFor(keySignature, chord)?.[p] : undefined
  // Both maps are memoised, so hand out a copy — a caller must never be able to
  // edit the cached entry out from under everyone else.
  return { ...(inChord ?? buildSpellingMap(keySignature)[p]) }
}

/** Full spelling (with octave) of a MIDI note in a key (and optional chord). */
export function spellPitch(midi: number, keySignature: string, chord?: ChordContext | null): Spelling {
  const { letter, accidental } = spellPitchClass(pitchClass(midi), keySignature, chord)
  // Octave follows the LETTER's natural pitch, so Cb/B# stay on their line.
  const naturalMidi = midi - accOffset(accidental)
  const octave = Math.floor(naturalMidi / 12) - 1
  return { letter, accidental, octave }
}

/** VexFlow key string for a MIDI note in a key, e.g. 68 in Eb → "ab/4". */
export function vexKey(midi: number, keySignature: string, chord?: ChordContext | null): string {
  const { letter, accidental, octave } = spellPitch(midi, keySignature, chord)
  return `${letter.toLowerCase()}${accidental}/${octave}`
}

/** Pretty chord symbol with key-correct enharmonics (in Eb: "Ab", not "G#").
 * The chord is its own context, so a slash bass that is a chord tone is spelled
 * from the stack (C#7/E#, never C#7/F) while a foreign bass follows the key. */
export function chordSymbol(r: number, q: string, keySignature: string, b?: number): string {
  const self: ChordContext = { r, q }
  const root = spellPitchClass(r, keySignature, self)
  const base = `${root.letter}${root.accidental}${q}`
  if (b === undefined || b === null) return base
  const bass = spellPitchClass(b, keySignature, self)
  return `${base}/${bass.letter}${bass.accidental}`
}

// Canonical key names per tonic pitch class, one conventional spelling each.
const MAJOR_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const MINOR_NAMES = ['c', 'c#', 'd', 'eb', 'e', 'f', 'f#', 'g', 'g#', 'a', 'bb', 'b']

/** Pretty key-signature name for a tonic pitch class + mode (minor = lowercase). */
export function keyNameForTonic(pc: number, mode: 'major' | 'minor'): string {
  return (mode === 'major' ? MAJOR_NAMES : MINOR_NAMES)[pitchClass(pc)]
}
