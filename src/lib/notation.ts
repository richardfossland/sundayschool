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
//
// Three invariants the planner guarantees, and that the tests pin down:
//   1. Every voice in a bar sums to exactly the bar's length — never more (a
//      note that reaches past the barline is CUT at the line and tied to its
//      continuation in the next bar), never less.
//   2. No sounding value is silently rounded away: values a single notehead
//      cannot express (5, 2.5, 8 …) are decomposed into tied segments whose
//      beats add back up to the original duration.
//   3. A note is never notated SHORTER than it sounds. When same-onset notes in
//      one hand disagree about length (real two-part writing in the firstemmig
//      settings), the hand splits into two layers: the moving voice keeps the
//      main layer, the sustained voice gets a second one.

import type { SongDoc, SongNote, SongChord, Hand } from '@/types/song'
import { vexKey, type ChordContext } from './spelling'
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
  [6, 'w', 1], // dotted whole — a full 6/4 bar, or 3 + 3
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

// Base rest durations for greedy gap filling: [beats, code, triplet].
const REST_UNITS: [number, string, boolean][] = [
  [4, 'w', false],
  [2, 'h', false],
  [T2, 'h', true],
  [1, 'q', false],
  [T4, 'q', true],
  [0.5, '8', false],
  [T8, '8', true],
  [0.25, '16', false],
  [T16, '16', true],
  [0.125, '32', false],
]

/** Classify a sounding value (in beats) into the nearest VexFlow duration.
 * Only for values that ARE representable (or for a last-resort approximation) —
 * `splitDuration` is the honest path for everything else. */
export function classifyDuration(beats: number): DurationSpec {
  let best: DurationSpec = { code: 'q', dots: 0, triplet: false }
  let bestErr = Infinity
  const consider = (b: number, spec: DurationSpec) => {
    const err = Math.abs(b - beats)
    // Strictly better only: on a tie the FIRST candidate wins. We walk the
    // tables shortest-value-first, so an ambiguous value is never inflated
    // (5 must not become a dotted whole), and plain beats triplet (1.5 is a
    // dotted quarter, not a triplet half).
    if (err < bestErr - EPS) {
      bestErr = err
      best = spec
    }
  }
  for (let i = PLAIN.length - 1; i >= 0; i--) {
    const [b, code, dots] = PLAIN[i]
    consider(b, { code, dots, triplet: false })
  }
  for (let i = TRIPLET.length - 1; i >= 0; i--) {
    const [b, code] = TRIPLET[i]
    consider(b, { code, dots: 0, triplet: true })
  }
  return best
}

/** The exact spec for a value a single notehead can express, else null. */
function exactSpec(beats: number): DurationSpec | null {
  for (const [b, code, dots] of PLAIN) {
    if (Math.abs(b - beats) < EPS) return { code, dots, triplet: false }
  }
  for (const [b, code] of TRIPLET) {
    if (Math.abs(b - beats) < EPS) return { code, dots: 0, triplet: true }
  }
  return null
}

/** One notehead's worth of a sounding value. */
export interface DurationSegment {
  beats: number
  duration: DurationSpec
}

/**
 * Express a sounding value as one or more tied noteheads. A value a single
 * notehead can carry comes back as one segment; anything else is decomposed
 * longest-first (5 → whole + quarter, 2.5 → half + eighth), and the planner
 * ties the segments together. The segments' beats always sum to `beats`, so no
 * duration is ever rounded away.
 */
export function splitDuration(beats: number): DurationSegment[] {
  const out: DurationSegment[] = []
  let rem = beats
  let guard = 0
  while (rem > EPS && guard++ < 16) {
    const exact = exactSpec(rem)
    if (exact) {
      out.push({ beats: rem, duration: exact })
      return out
    }
    const p = PLAIN.find(([b]) => b <= rem + EPS)
    if (!p) break
    out.push({ beats: p[0], duration: { code: p[1], dots: p[2], triplet: false } })
    rem -= p[0]
  }
  // Below the shortest notehead we can draw: keep the value, approximate the glyph.
  if (rem > EPS) out.push({ beats: rem, duration: classifyDuration(rem) })
  return out
}

/** A rest segment produced when filling a gap. */
export interface RestSpec {
  code: string
  beats: number
  triplet: boolean
}

// A leftover is fillable when it is a whole number of 32nds or of triplet 16ths.
function isFillable(x: number): boolean {
  if (x < EPS) return true
  for (const unit of [0.125, T16]) {
    const m = x / unit
    if (Math.abs(m - Math.round(m)) < 1e-5) return true
  }
  return false
}

/** Greedy split of a gap into representable rests (base durations, no dots).
 * Triplet-aware: a gap of n/3 beats fills with triplet rests instead of losing
 * the odd twelfth to the nearest binary unit. */
export function fillRests(len: number): RestSpec[] {
  const out: RestSpec[] = []
  let rem = len
  let guard = 0
  while (rem > EPS && guard++ < 64) {
    const unit = pickRestUnit(rem)
    if (!unit) break
    out.push({ code: unit[1], beats: unit[0], triplet: unit[2] })
    rem -= unit[0]
  }
  return out
}

// Largest unit that fits AND leaves a remainder we can still fill exactly.
function pickRestUnit(rem: number): [number, string, boolean] | null {
  for (const u of REST_UNITS) if (Math.abs(u[0] - rem) < EPS) return u
  let fallback: [number, string, boolean] | null = null
  for (const u of REST_UNITS) {
    if (u[0] > rem + EPS) continue
    if (isFillable(rem - u[0])) return u
    fallback ??= u
  }
  return fallback
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

/**
 * Group a voice's tokens into triplet brackets: token indices, one array per
 * 3:2 tuplet. A run of consecutive triplet tokens closes as soon as it fills a
 * plain value — 3 triplet eighths make a beat, but so does a triplet quarter
 * plus a triplet eighth. Counting tickables instead ("every 3 in a row") draws
 * the bracket over 4/3 of a beat and leaves the run's tail orphaned, printed as
 * if it were an ordinary eighth (blessed-assurance, bar 3).
 */
export function tupletGroups(tokens: Token[]): number[][] {
  const groups: number[][] = []
  let run: number[] = []
  let sum = 0
  tokens.forEach((tok, i) => {
    if (!tok.duration.triplet) {
      run = []
      sum = 0
      return
    }
    run.push(i)
    sum += tok.beats
    const thirtySeconds = sum * 8
    if (Math.abs(thirtySeconds - Math.round(thirtySeconds)) < 1e-6 && Math.round(thirtySeconds) > 0) {
      groups.push(run)
      run = []
      sum = 0
    }
  })
  return groups
}

/** A bar with both hands' voices resolved into tokens. `R2`/`L2` hold the
 * sustained second layer for the rare bars where one hand carries two rhythms
 * at once; they are null (not an empty list) whenever one voice suffices. */
export interface Bar extends BarRange {
  R: Token[] // treble voice, main layer
  L: Token[] // bass voice, main layer
  R2: Token[] | null // treble voice, sustained layer
  L2: Token[] | null // bass voice, sustained layer
}

/** Every layer of one hand in a bar, main layer first. */
export function barLayers(bar: Bar, hand: Hand): Token[][] {
  const extra = hand === 'R' ? bar.R2 : bar.L2
  return extra ? [bar[hand], extra] : [bar[hand]]
}

/** A tie to draw: references tokens by their index within a bar's hand voice. */
export interface Tie {
  hand: Hand
  fromBar: number // array index into `bars`
  fromLayer: number // 0 = main layer, 1 = sustained layer
  fromToken: number // index within that bar's hand/layer token list
  fromKey: number // key index within the chord
  toBar: number
  toLayer: number
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

// Stable identity for a note event, so authored ties can find their partner.
function beatKey(beat: number): number {
  return Math.round(beat * 1000)
}
function noteId(hand: Hand, pitch: number, beat: number): string {
  return `${hand}:${pitch}:${beatKey(beat)}`
}

interface Pos {
  barIdx: number
  hand: Hand
  layer: number
  tokenIdx: number
  keyIdx: number
}

/** One note's slice inside a single bar (a note crossing a barline yields one
 * piece per bar it touches). */
interface Piece {
  noteIdx: number // index into doc.notes — the tie chain's identity
  p: number
  t: number
  d: number
}

/** Cut every note at the barlines it crosses. The pieces of one note are tied
 * back together by `buildTies`, so a held note reads as one sound again. */
function cutPieces(doc: SongDoc, ranges: BarRange[], hand: Hand): Piece[][] {
  const perBar: Piece[][] = ranges.map(() => [])
  doc.notes.forEach((n, noteIdx) => {
    if (n.h !== hand) return
    const end = n.t + n.d
    let barIdx = ranges.findIndex((b) => n.t >= b.startBeat - EPS && n.t < b.endBeat - EPS)
    if (barIdx < 0) return // onset outside the timeline — nothing to draw
    let start = n.t
    while (barIdx < ranges.length && start < end - EPS) {
      const stop = Math.min(end, ranges[barIdx].endBeat)
      if (stop - start > EPS) perBar[barIdx].push({ noteIdx, p: n.p, t: start, d: stop - start })
      start = stop
      barIdx++
    }
  })
  return perBar
}

/**
 * The chord sounding at a beat, or null outside every chord's span. Chords tile
 * the song in onset order, so this is a binary search — the planner asks once
 * per note and a linear scan would make spelling quadratic on the long
 * generated arrangements.
 */
export function chordAtBeat(chords: SongChord[], beat: number): SongChord | null {
  let lo = 0
  let hi = chords.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const c = chords[mid]
    if (beat < c.t - EPS) hi = mid - 1
    else if (beat >= c.t + c.d - EPS) lo = mid + 1
    else return c
  }
  return null
}

/**
 * The VexFlow key string for every note in the doc, indexed like `doc.notes`.
 *
 * Spelling is decided ONCE per note, from the chord sounding at the note's own
 * onset — never per notehead. Two things depend on that: a note cut at a
 * barline keeps one spelling across both halves (its second piece starts under
 * whatever chord the next bar opens with), and an authored tie chain inherits
 * the head's chord, so the two noteheads a tie joins can never disagree about
 * which line they sit on.
 */
function planNoteKeys(doc: SongDoc): string[] {
  const chords = [...doc.chords].sort((a, b) => a.t - b.t)
  const ctx: (ChordContext | null)[] = doc.notes.map((n) => {
    const c = chordAtBeat(chords, n.t)
    return c ? { r: c.r, q: c.q } : null
  })

  const startsAt = new Map<string, number>()
  doc.notes.forEach((n, i) => {
    const id = noteId(n.h, n.p, n.t)
    if (!startsAt.has(id)) startsAt.set(id, i)
  })
  // Onset order, so a chain of three or more tied notes propagates in one pass.
  const order = doc.notes.map((_, i) => i).sort((a, b) => doc.notes[a].t - doc.notes[b].t)
  for (const i of order) {
    const n = doc.notes[i]
    if (!n.tie) continue
    const j = startsAt.get(noteId(n.h, n.p, n.t + n.d))
    if (j !== undefined && j !== i) ctx[j] = ctx[i]
  }

  return doc.notes.map((n, i) => vexKey(n.p, doc.keySignature, ctx[i]))
}

interface Layer {
  tokens: Token[]
  cursor: number
}

const MAX_LAYERS = 2

// Rests from the layer's cursor up to `to`, then park the cursor exactly there.
function fillTo(layer: Layer, to: number) {
  if (to - layer.cursor > EPS) {
    let at = layer.cursor
    for (const r of fillRests(to - layer.cursor)) {
      layer.tokens.push({
        kind: 'rest',
        onset: at,
        beats: r.beats,
        duration: { code: r.code, dots: 0, triplet: r.triplet },
        keys: [],
        midis: [],
      })
      at += r.beats
    }
  }
  layer.cursor = Math.max(layer.cursor, to)
}

// Last resort when both layers are still sounding at a new onset: shorten the
// least-busy layer's tail so the bar can never overflow. (Zero occurrences in
// the seed library — the sweep asserts it stays that way.)
function clipLayer(layer: Layer, to: number) {
  const last = layer.tokens[layer.tokens.length - 1]
  if (last && to - last.onset > EPS) {
    last.beats = to - last.onset
    last.duration = classifyDuration(last.beats)
  }
  layer.cursor = to
}

/** Plan one hand of one bar into 1–2 layers of tokens. */
function planHand(
  noteKeys: string[],
  bar: BarRange,
  barIdx: number,
  hand: Hand,
  pieces: Piece[],
  emitted: Map<number, Pos[]>,
): Token[][] {
  const layers: Layer[] = [{ tokens: [], cursor: bar.startBeat }]

  // Same-onset pieces form a chord…
  const byOnset = new Map<number, Piece[]>()
  for (const pc of pieces) {
    const k = beatKey(pc.t)
    const at = byOnset.get(k)
    if (at) at.push(pc)
    else byOnset.set(k, [pc])
  }

  for (const [, group] of [...byOnset.entries()].sort((a, b) => a[0] - b[0])) {
    // …but only where they agree on length. Where they don't, the SHORTEST
    // value keeps the main layer: in every two-part bar in the library the next
    // onset continues that moving voice, while the longer value is a sustained
    // inner/outer voice that belongs on its own layer.
    const byDur = new Map<number, Piece[]>()
    for (const pc of group) {
      const k = beatKey(pc.d)
      const at = byDur.get(k)
      if (at) at.push(pc)
      else byDur.set(k, [pc])
    }
    const subs = [...byDur.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v)
    // A hand only ever gets two layers, so a (never-seen) three-way split folds
    // its tail into the last layer, notated with the shortest of those values —
    // the bar-length invariant outranks the sustain of a third inner voice.
    if (subs.length > MAX_LAYERS) subs.splice(MAX_LAYERS - 1, subs.length, subs.slice(MAX_LAYERS - 1).flat())

    subs.forEach((sub, s) => {
      const t = sub[0].t
      let li = layers.findIndex((l, i) => (s === 0 || i > 0) && l.cursor <= t + EPS)
      if (li < 0 && layers.length < MAX_LAYERS) {
        layers.push({ tokens: [], cursor: bar.startBeat })
        li = layers.length - 1
      }
      if (li < 0) {
        li = layers.reduce((best, l, i) => (l.cursor < layers[best].cursor ? i : best), 0)
        clipLayer(layers[li], t)
      }
      const layer = layers[li]
      fillTo(layer, t)

      const sorted = [...sub].sort((a, b) => a.p - b.p)
      const midis = sorted.map((pc) => pc.p)
      const keys = sorted.map((pc) => noteKeys[pc.noteIdx])
      for (const seg of splitDuration(sub[0].d)) {
        const tokenIdx = layer.tokens.length
        sorted.forEach((pc, keyIdx) => {
          const list = emitted.get(pc.noteIdx)
          const at: Pos = { barIdx, hand, layer: li, tokenIdx, keyIdx }
          if (list) list.push(at)
          else emitted.set(pc.noteIdx, [at])
        })
        layer.tokens.push({
          kind: 'note',
          onset: layer.cursor,
          beats: seg.beats,
          duration: seg.duration,
          keys,
          midis,
        })
        layer.cursor += seg.beats
      }
    })
  }

  for (const l of layers) fillTo(l, bar.endBeat)
  return layers.map((l) => l.tokens)
}

// Resolve the tie chains: every note's own segments (barline cuts + decomposed
// values) plus the authored `tie` flags (both ends must exist).
function buildTies(doc: SongDoc, emitted: Map<number, Pos[]>): Tie[] {
  const ties: Tie[] = []
  const startsAt = new Map<string, number>()
  doc.notes.forEach((n, i) => {
    const id = noteId(n.h, n.p, n.t)
    if (!startsAt.has(id)) startsAt.set(id, i)
  })

  const link = (from: Pos, to: Pos) =>
    ties.push({
      hand: from.hand,
      fromBar: from.barIdx,
      fromLayer: from.layer,
      fromToken: from.tokenIdx,
      fromKey: from.keyIdx,
      toBar: to.barIdx,
      toLayer: to.layer,
      toToken: to.tokenIdx,
      toKey: to.keyIdx,
    })

  doc.notes.forEach((n: SongNote, i) => {
    const list = emitted.get(i)
    if (!list || list.length === 0) return
    for (let k = 1; k < list.length; k++) link(list[k - 1], list[k])
    if (!n.tie) return
    const j = startsAt.get(noteId(n.h, n.p, n.t + n.d))
    const next = j === undefined ? undefined : emitted.get(j)
    if (next && next.length > 0) link(list[list.length - 1], next[0])
  })
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
  const emitted = new Map<number, Pos[]>()
  const piecesR = cutPieces(doc, ranges, 'R')
  const piecesL = cutPieces(doc, ranges, 'L')
  const noteKeys = planNoteKeys(doc)

  const bars: Bar[] = ranges.map((br, barIdx) => {
    const r = planHand(noteKeys, br, barIdx, 'R', piecesR[barIdx], emitted)
    const l = planHand(noteKeys, br, barIdx, 'L', piecesL[barIdx], emitted)
    return { ...br, R: r[0], L: l[0], R2: r[1] ?? null, L2: l[1] ?? null }
  })

  return {
    bars,
    ties: buildTies(doc, emitted),
    keySpec: vexflowKeySpec(doc.keySignature),
    keySignature: doc.keySignature,
    timeSignature: doc.timeSignature,
  }
}
