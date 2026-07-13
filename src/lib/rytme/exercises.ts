// ── Rhythm exercise generators (pure, no audio, no DOM) ──────────────────────
//
// Deterministic generators for the Rytme fag. A generated rhythm is BOTH:
//   • `hits`  — DrumHit[] on the snare pitch (38), the timing targets the
//               play-along trainer (lib/drums/use-drum-trainer) judges taps
//               against; and
//   • `doc`   — a SongDoc carrying the exact same rhythm as notes on ONE pitch
//               (B4 = 71, right hand) so NotationSong can draw it as sheet music
//               for the learner to read.
// The two views are built from ONE structural plan, so what you read is exactly
// what is judged and exactly what is played back.
//
// Every generator takes an explicit seeded RNG (Math.random is banned in the
// testable layer — mirrors lib/gehor/exercises). The same seed always yields the
// same session, so tests can assert level constraints over many samples.
//
// 16th notes and triplets: BOTH are kept at level 3. lib/notation.ts's
// classifyDuration already resolves 0.25 → '16', 0.375 → dotted 16th, and 1/3 →
// a tuplet-marked '8' (drawn as a 3:2 bracket by NotationSong), so no value we
// emit is unrepresentable. See the level-3 pool below.

import type { SongDoc, SongNote } from '@/types/song'
import type { DrumHit } from '@/lib/drums/types'

export type Rng = () => number
export type Level = 1 | 2 | 3

// ── Seeded PRNG (mulberry32) — copied from lib/gehor/exercises ────────────────

function hashSeed(seed: number | string | undefined): number {
  if (seed === undefined) return 0x9e3779b9
  if (typeof seed === 'number') return seed >>> 0
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number): Rng {
  let state = a >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A fresh seeded RNG — same seed always yields the same sequence. */
export function createRng(seed: number | string | undefined): Rng {
  return mulberry32(hashSeed(seed))
}

/** Fisher–Yates with a seeded RNG. */
export function seededShuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Rhythmic figures ─────────────────────────────────────────────────────────
// A figure fills a whole number of quarter-note beats (or a 6/8 dotted-quarter
// pulse of 1.5 beats). `notes` are the sounding onsets WITHIN the figure, with
// their durations in beats; the gaps become rests automatically in notation
// (lib/notation.ts fills them). Figures never cross their own span, so tiling a
// bar from figures never straddles a barline — bars stay well-formed.

interface Fig {
  id: string
  beats: number
  w: number // relative weight when picking
  notes: { at: number; dur: number }[]
}

// Quarter-grid figures (simple meters).
const Q: Fig = { id: 'q', beats: 1, w: 5, notes: [{ at: 0, dur: 1 }] }
const QR: Fig = { id: 'qr', beats: 1, w: 2, notes: [] }
const H: Fig = { id: 'h', beats: 2, w: 3, notes: [{ at: 0, dur: 2 }] }
const EE: Fig = { id: 'ee', beats: 1, w: 4, notes: [{ at: 0, dur: 0.5 }, { at: 0.5, dur: 0.5 }] }
// Punktert fjerdedel + åttedel.
const DQE: Fig = { id: 'dqe', beats: 2, w: 2, notes: [{ at: 0, dur: 1.5 }, { at: 1.5, dur: 0.5 }] }
// Synkope: åttedel – fjerdedel (på offbeat) – åttedel.
const SYNC: Fig = { id: 'sync', beats: 2, w: 2, notes: [{ at: 0, dur: 0.5 }, { at: 0.5, dur: 1 }, { at: 1.5, dur: 0.5 }] }
// Offbeat-åttedel: åttedelspause + åttedel.
const OFFE: Fig = { id: 'offe', beats: 1, w: 2, notes: [{ at: 0.5, dur: 0.5 }] }
// Triol: tre åttedelstrioler (markeres som tuplet i notasjonen).
const TRIP: Fig = { id: 'trip', beats: 1, w: 2, notes: [{ at: 0, dur: 1 / 3 }, { at: 1 / 3, dur: 1 / 3 }, { at: 2 / 3, dur: 1 / 3 }] }
// 16-deler.
const S16: Fig = { id: 's16', beats: 1, w: 1, notes: [{ at: 0, dur: 0.25 }, { at: 0.25, dur: 0.25 }, { at: 0.5, dur: 0.25 }, { at: 0.75, dur: 0.25 }] }
const E16: Fig = { id: 'e16', beats: 1, w: 1, notes: [{ at: 0, dur: 0.5 }, { at: 0.5, dur: 0.25 }, { at: 0.75, dur: 0.25 }] }
const S16E: Fig = { id: 's16e', beats: 1, w: 1, notes: [{ at: 0, dur: 0.25 }, { at: 0.25, dur: 0.25 }, { at: 0.5, dur: 0.5 }] }

// 6/8 dotted-quarter pulse figures (1.5 beats each; two pulses = one bar).
const P_DQ: Fig = { id: 'p_dq', beats: 1.5, w: 3, notes: [{ at: 0, dur: 1.5 }] }
const P_QE: Fig = { id: 'p_qe', beats: 1.5, w: 3, notes: [{ at: 0, dur: 1 }, { at: 1, dur: 0.5 }] }
const P_EEE: Fig = { id: 'p_eee', beats: 1.5, w: 3, notes: [{ at: 0, dur: 0.5 }, { at: 0.5, dur: 0.5 }, { at: 1, dur: 0.5 }] }
const P_EQ: Fig = { id: 'p_eq', beats: 1.5, w: 2, notes: [{ at: 0, dur: 0.5 }, { at: 0.5, dur: 1 }] }
const P_R: Fig = { id: 'p_r', beats: 1.5, w: 1, notes: [] }

// Level → the figure pool used to fill each bar of a simple-meter rhythm.
//   1 — fjerdedeler, halvnoter, fjerdedelspauser
//   2 — + åttedeler og punkterte fjerdedeler
//   3 — + synkoper, trioler, 16-deler (and 3/4 or 6/8 meters, see meterFor)
const POOL: Record<Level, Fig[]> = {
  1: [Q, QR, H],
  2: [Q, QR, H, EE, DQE],
  3: [Q, QR, H, EE, DQE, SYNC, OFFE, TRIP, S16, E16, S16E],
}
const POOL_68: Fig[] = [P_DQ, P_QE, P_EEE, P_EQ, P_R]

// ── Weighted pick ────────────────────────────────────────────────────────────

function weightedPick(figs: Fig[], rng: Rng): Fig {
  const total = figs.reduce((a, f) => a + f.w, 0)
  let r = rng() * total
  for (const f of figs) {
    r -= f.w
    if (r < 0) return f
  }
  return figs[figs.length - 1]
}

// ── Meter per level ──────────────────────────────────────────────────────────

interface Meter {
  timeSignature: string
  barBeats: number // quarter-note beats per bar (6/8 → 3)
  bars: number
  pool: Fig[]
  compound: boolean // 6/8: fill in 1.5-beat pulses
}

function meterFor(level: Level, rng: Rng): Meter {
  if (level === 1) return { timeSignature: '4/4', barBeats: 4, bars: 2, pool: POOL[1], compound: false }
  if (level === 2) return { timeSignature: '4/4', barBeats: 4, bars: 4, pool: POOL[2], compound: false }
  // Level 3: mostly 4/4, sometimes 3/4 or 6/8.
  const r = rng()
  if (r < 0.5) return { timeSignature: '4/4', barBeats: 4, bars: 4, pool: POOL[3], compound: false }
  if (r < 0.75) return { timeSignature: '3/4', barBeats: 3, bars: 4, pool: POOL[3], compound: false }
  return { timeSignature: '6/8', barBeats: 3, bars: 4, pool: POOL_68, compound: true }
}

// ── Structural plan ──────────────────────────────────────────────────────────

interface RhythmPlan {
  meter: Meter
  bars: Fig[][] // one figure list per bar; each list sums to meter.barBeats
}

/** Fill one bar with figures that exactly tile `barBeats`. All figures have
 * integer beats (or 1.5 in compound meter, where barBeats is a multiple of 1.5),
 * and a beats-1 (or a 1.5 pulse) figure is always available, so the fill is
 * always exact and never straddles a barline. */
function fillBar(pool: Fig[], barBeats: number, rng: Rng): Fig[] {
  const out: Fig[] = []
  let rem = barBeats
  while (rem > 1e-6) {
    const options = pool.filter((f) => f.beats <= rem + 1e-6)
    const fig = weightedPick(options, rng)
    out.push(fig)
    rem -= fig.beats
  }
  return out
}

function planRhythm(level: Level, rng: Rng): RhythmPlan {
  const meter = meterFor(level, rng)
  const bars: Fig[][] = []
  for (let b = 0; b < meter.bars; b++) bars.push(fillBar(meter.pool, meter.barBeats, rng))
  return { meter, bars }
}

// ── Plan → exercise (hits + doc) ─────────────────────────────────────────────

export interface RhythmExercise {
  /** Timing targets, all on the snare pitch (38) — the trainer judges taps
   * against these. Sorted by onset. */
  hits: DrumHit[]
  /** The same rhythm as notes on B4 (71), right hand, for NotationSong. Passes
   * songDocSchema + docInvariants. */
  doc: SongDoc
  /** Total length in quarter-note beats. */
  lengthBeats: number
}

const READ_PITCH = 71 // B4 — sits cleanly on the treble staff, no accidental in C

function planToExercise(plan: RhythmPlan): RhythmExercise {
  const { meter, bars } = plan
  const notes: SongNote[] = []
  const hits: DrumHit[] = []
  let cursor = 0
  for (const bar of bars) {
    for (const fig of bar) {
      for (const n of fig.notes) {
        const t = cursor + n.at
        notes.push({ p: READ_PITCH, t, d: n.dur, h: 'R', v: 0.85 })
        hits.push({ t, p: 38, v: 0.85 })
      }
      cursor += fig.beats
    }
  }
  const totalBeats = meter.bars * meter.barBeats
  hits.sort((a, b) => a.t - b.t)
  const doc: SongDoc = {
    formatVersion: 1,
    timeSignature: meter.timeSignature,
    beatsPerBar: meter.barBeats,
    pickupBeats: 0,
    totalBeats,
    keySignature: 'C',
    sections: [{ id: 'r', kind: 'verse', label: 'Rytme', startBeat: 0, endBeat: totalBeats }],
    notes,
    chords: [],
  }
  return { hits, doc, lengthBeats: totalBeats }
}

/** A signature that identifies a rhythm by its hit onsets (ms-rounded). Two
 * rhythms are the same iff they hit at the same times. */
function onsetSignature(hits: DrumHit[]): string {
  return hits.map((h) => Math.round(h.t * 1000)).join(',')
}

/** A non-degenerate plan (at least two hits) — resamples if the RNG produced an
 * (almost) empty bar sequence. Deterministic: it keeps drawing from the SAME rng. */
function planRhythmNonEmpty(level: Level, rng: Rng): RhythmPlan {
  for (let i = 0; i < 8; i++) {
    const plan = planRhythm(level, rng)
    const count = plan.bars.reduce((a, bar) => a + bar.reduce((s, f) => s + f.notes.length, 0), 0)
    if (count >= 2) return plan
  }
  return planRhythm(level, rng)
}

/** Generate one rhythm (hits + notation doc) for the given level and RNG. */
export function generateRhythm(level: Level, rng: Rng): RhythmExercise {
  return planToExercise(planRhythmNonEmpty(level, rng))
}

// ── Rhythmic dictation ───────────────────────────────────────────────────────

export interface RhythmDictation {
  /** Three notated rhythms — the learner picks which matches what they heard. */
  options: RhythmExercise[]
  /** Index into `options` of the correct (played) rhythm. */
  correctIndex: number
}

/** Mutate one figure of `plan` into a different figure of the same span, so the
 * result is a plausible-but-wrong rhythm. Returns null if no distinct swap was
 * found in a bounded search. */
function mutatePlan(plan: RhythmPlan, rng: Rng): RhythmPlan | null {
  const pool = plan.meter.pool
  // Try several random positions until one has a same-span alternative.
  for (let attempt = 0; attempt < 12; attempt++) {
    const b = Math.floor(rng() * plan.bars.length)
    const bar = plan.bars[b]
    const i = Math.floor(rng() * bar.length)
    const fig = bar[i]
    const figSig = fig.notes.map((n) => `${Math.round(n.at * 1000)}:${Math.round(n.dur * 1000)}`).join(',')
    const alts = pool.filter((f) => {
      if (Math.abs(f.beats - fig.beats) > 1e-6) return false
      const sig = f.notes.map((n) => `${Math.round(n.at * 1000)}:${Math.round(n.dur * 1000)}`).join(',')
      return sig !== figSig
    })
    if (alts.length === 0) continue
    const next: Fig[][] = plan.bars.map((bb) => [...bb])
    next[b][i] = weightedPick(alts, rng)
    return { meter: plan.meter, bars: next }
  }
  return null
}

/**
 * A dictation task: one played rhythm plus two distractors, all notated. The UI
 * plays the correct rhythm and shows the three options as small scores.
 */
export function rhythmDictation(level: Level, rng: Rng): RhythmDictation {
  const correctPlan = planRhythmNonEmpty(level, rng)
  const correct = planToExercise(correctPlan)
  const used = new Set<string>([onsetSignature(correct.hits)])
  const distractors: RhythmExercise[] = []

  for (let guard = 0; guard < 40 && distractors.length < 2; guard++) {
    const mutated = mutatePlan(correctPlan, rng)
    if (!mutated) continue
    const ex = planToExercise(mutated)
    const sig = onsetSignature(ex.hits)
    if (used.has(sig)) continue
    used.add(sig)
    distractors.push(ex)
  }

  // Fallback (only if the bounded search stalled): derive fresh rhythms until we
  // have two distinct distractors. Guaranteed to terminate — the RNG keeps moving.
  while (distractors.length < 2) {
    const ex = generateRhythm(level, rng)
    const sig = onsetSignature(ex.hits)
    if (used.has(sig)) continue
    used.add(sig)
    distractors.push(ex)
  }

  const options = seededShuffle([correct, ...distractors], rng)
  return { options, correctIndex: options.indexOf(correct) }
}
