// ── Notation planning (pure, no VexFlow, no DOM) ─────────────────────────────
//
// Turns a whole SongDoc into a bar-by-bar, hand-by-hand plan that a client
// component can hand straight to VexFlow. The classification core (beats →
// duration codes, chord grouping by onset, greedy rest filling) is grown from
// SundayLicks' `notation.ts`, extended here to: split full songs into bars
// (respecting the pickup/opptakt as a short "bar 0"), split into treble (R) and
// bass (L) voices, add dotted durations, mark triplet tuplets, and resolve
// `tie` flags into StaveTie metadata. All numbers stay plain so the whole file
// is unit-testable in Node with zero VexFlow dependency — the component builds
// the actual StaveNote/StaveTie/Accidental objects from this plan.

import type { SongDoc, SongNote, Hand } from '@/types/song'
import { vexKey } from './spelling'
import { parseKeySignature } from './spelling'

const EPS = 1e-6

// Triplet beat values (quarter-note beats).
const T16 = 1 / 6 // triplet sixteenth
const T8 = 1 / 3 // triplet eighth
const T4 = 2 / 3 // triplet quarter
const T2 = 4 / 3 // triplet half

/** A VexFlow duration classification for a single sounding value. */
export interface DurationSpec {
  code: string // base VexFlow duration code: 'w' | 'h' | 'q' | '8' | '16' | '32'
  dots: number // 0 or 1 (we only author single dots)
  triplet: boolean // part of a 3:2 tuplet
}

// Plain (non-triplet) representable values, longest first: [beats, code, dots].
const PLAIN: [number, string, number][] = [
  [4, 'w', 0],
  [3, 'h', 1],
  [2, 'h', 0],
  [1.5, 'q', 1],
  [1, 'q', 0],
  [0.75, '8', 1],
  [0.5, '8', 0],
  [0.375, '16', 1],
  [0.25, '16', 0],
  [0.125, '32', 0],
]

// Triplet values: [beats, code].
const TRIPLET: [number, string][] = [
  [T2, 'h'],
  [T4, 'q'],
  [T8, '8'],
  [T16, '16'],
]

// Base rest durations for greedy gap filling: [beats, code].
const REST_UNITS: [number, string][] = [
  [4, 'w'],
  [2, 'h'],
  [1, 'q'],
  [0.5, '8'],
  [0.25, '16'],
  [0.125, '32'],
]

/** Classify a sounding value (in beats) into the nearest VexFlow duration. */
export function classifyDuration(beats: number): DurationSpec {
  let best: DurationSpec = { code: 'q', dots: 0, triplet: false }
  let bestErr = Infinity
  for (const [b, code, dots] of PLAIN) {
    const err = Math.abs(b - beats)
    if (err < bestErr) {
      bestErr = err
      best = { code, dots, triplet: false }
    }
  }
  for (const [b, code] of TRIPLET) {
    const err = Math.abs(b - beats)
    if (err < bestErr) {
      bestErr = err
      best = { code, dots: 0, triplet: true }
    }
  }
  return best
}

/** A rest segment produced when filling a gap. */
export interface RestSpec {
  code: string
  beats: number
}

/** Greedy split of a gap into representable rests (base durations, no dots). */
export function fillRests(len: number): RestSpec[] {
  const out: RestSpec[] = []
  let rem = len
  for (const [beats, code] of REST_UNITS) {
    while (rem >= beats - EPS) {
      out.push({ code, beats })
      rem -= beats
    }
  }
  return out
}

/** A bar's beat span. Pickup notes live in "bar 0"; first full bar is bar 1. */
export interface BarRange {
  number: number // display bar number (0 = pickup)
  startBeat: number
  endBeat: number // exclusive
  beats: number
  isPickup: boolean
}

/**
 * Split a SongDoc's timeline into bars. A non-zero pickup becomes a short "bar
 * 0" of `pickupBeats`; the first full bar (number 1) starts at `pickupBeats`.
 * The final bar may be shorter than `beatsPerBar` if the song doesn't fill it.
 */
export function splitBars(doc: SongDoc): BarRange[] {
  const { pickupBeats, beatsPerBar, totalBeats } = doc
  const bars: BarRange[] = []
  let start = 0
  let number = 1

  if (pickupBeats > EPS) {
    const end = Math.min(pickupBeats, totalBeats)
    bars.push({ number: 0, startBeat: 0, endBeat: end, beats: end, isPickup: true })
    start = end
  }
  while (start < totalBeats - EPS) {
    const end = Math.min(start + beatsPerBar, totalBeats)
    bars.push({ number, startBeat: start, endBeat: end, beats: end - start, isPickup: false })
    start = end
    number++
  }
  return bars
}

// ── Voice tokens ─────────────────────────────────────────────────────────────

/** One tickable in a voice: a sounding note/chord or a rest. */
export interface Token {
  kind: 'note' | 'rest'
  onset: number // absolute beat
  beats: number
  duration: DurationSpec
  keys: string[] // VexFlow key strings low→high (e.g. 'ab/4'); [] for a rest
  midis: number[] // sorted low→high; [] for a rest
}

/** A bar with both hands' voices resolved into tokens. */
export interface Bar extends BarRange {
  R: Token[] // treble voice
  L: Token[] // bass voice
}

/** A tie to draw: references tokens by their index within a bar's hand voice. */
export interface Tie {
  hand: Hand
  fromBar: number // array index into `bars`
  fromToken: number // index within that bar's R/L token list
  fromKey: number // key index within the chord
  toBar: number
  toToken: number
  toKey: number
}

/** The complete render plan for one song. */
export interface ScorePlan {
  bars: Bar[]
  ties: Tie[]
  keySpec: string // VexFlow key-signature spec, e.g. 'Eb' | 'Gm' | 'C'
  keySignature: string // the source SongDoc key
  timeSignature: string
}

interface Group {
  t: number
  beats: number // chord duration = shortest member
  midis: number[] // sorted low→high
}

// Group same-onset notes into chords (simultaneous notes → one tickable).
function groupByOnset(notes: SongNote[]): Group[] {
  const map = new Map<number, Group>()
  for (const n of notes) {
    const key = Math.round(n.t * 1000)
    const g = map.get(key)
    if (g) {
      g.midis.push(n.p)
      g.beats = Math.min(g.beats, n.d)
    } else {
      map.set(key, { t: n.t, beats: n.d, midis: [n.p] })
    }
  }
  const groups = [...map.values()]
  groups.forEach((g) => g.midis.sort((a, b) => a - b))
  return groups.sort((a, b) => a.t - b.t)
}

// Stable identity for a note event, so ties can find their partner.
function beatKey(beat: number): number {
  return Math.round(beat * 1000)
}
function noteId(hand: Hand, pitch: number, beat: number): string {
  return `${hand}:${pitch}:${beatKey(beat)}`
}

interface Pos {
  barIdx: number
  hand: Hand
  tokenIdx: number
  keyIdx: number
}

// Build one hand's token list for one bar, recording note positions for ties.
function planVoice(
  doc: SongDoc,
  bar: BarRange,
  hand: Hand,
  barIdx: number,
  pos: Map<string, Pos>,
): Token[] {
  const inBar = doc.notes.filter(
    (n) => n.h === hand && n.t >= bar.startBeat - EPS && n.t < bar.endBeat - EPS,
  )
  const groups = groupByOnset(inBar)
  const tokens: Token[] = []
  let cursor = bar.startBeat

  const fill = (from: number, to: number) => {
    if (to - from < EPS) return
    let at = from
    for (const r of fillRests(to - from)) {
      tokens.push({
        kind: 'rest',
        onset: at,
        beats: r.beats,
        duration: { code: r.code, dots: 0, triplet: false },
        keys: [],
        midis: [],
      })
      at += r.beats
    }
  }

  for (const g of groups) {
    if (g.t > cursor + EPS) fill(cursor, g.t)
    const tokenIdx = tokens.length
    g.midis.forEach((p, keyIdx) => {
      pos.set(noteId(hand, p, g.t), { barIdx, hand, tokenIdx, keyIdx })
    })
    tokens.push({
      kind: 'note',
      onset: g.t,
      beats: g.beats,
      duration: classifyDuration(g.beats),
      keys: g.midis.map((p) => vexKey(p, doc.keySignature)),
      midis: g.midis,
    })
    cursor = g.t + g.beats
  }
  fill(cursor, bar.endBeat)
  return tokens
}

// Resolve `tie` flags into concrete token references (both ends must exist).
function buildTies(doc: SongDoc, pos: Map<string, Pos>): Tie[] {
  const ties: Tie[] = []
  for (const n of doc.notes) {
    if (!n.tie) continue
    const from = pos.get(noteId(n.h, n.p, n.t))
    const to = pos.get(noteId(n.h, n.p, n.t + n.d))
    if (!from || !to) continue // dangling tie (validated away at seed time)
    ties.push({
      hand: n.h,
      fromBar: from.barIdx,
      fromToken: from.tokenIdx,
      fromKey: from.keyIdx,
      toBar: to.barIdx,
      toToken: to.tokenIdx,
      toKey: to.keyIdx,
    })
  }
  return ties
}

/** VexFlow key-signature spec for a SongDoc key: 'Eb' major → 'Eb', 'g' → 'Gm'. */
export function vexflowKeySpec(keySignature: string): string {
  const { letter, accidental, mode } = parseKeySignature(keySignature)
  const base = letter + accidental
  return mode === 'minor' ? `${base}m` : base
}

/** Plan a whole song: bars (both voices) + ties + key/time metadata. Pure. */
export function planScore(doc: SongDoc): ScorePlan {
  const ranges = splitBars(doc)
  const pos = new Map<string, Pos>()
  const bars: Bar[] = ranges.map((br, barIdx) => ({
    ...br,
    R: planVoice(doc, br, 'R', barIdx, pos),
    L: planVoice(doc, br, 'L', barIdx, pos),
  }))
  return {
    bars,
    ties: buildTies(doc, pos),
    keySpec: vexflowKeySpec(doc.keySignature),
    keySignature: doc.keySignature,
    timeSignature: doc.timeSignature,
  }
}
