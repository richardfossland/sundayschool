// ── Bladspill (sight-reading) exercise generator (pure, no audio) ─────────────
//
// Deterministic generator for reading exercises. Each exercise is a small,
// fully-valid SongDoc (4–8 bars) so it renders straight through NotationSong and
// drills through the shared wait-mode / keyboard pipeline — the same semantic
// score format the Piano subject uses, just machine-generated.
//
// Like lib/gehor/exercises, the generator takes an explicit seeded RNG
// (mulberry32) — Math.random is banned in the testable layer, so the same seed
// always yields the same score. The UI seeds one RNG per session (Date.now())
// and draws a fresh exercise each time "Ny oppgave" is pressed. Every output is
// guaranteed to pass songDocSchema + docInvariants (asserted in the tests).

import { pitchClass } from '../music'
import { scalePitches, diatonicTriads } from '../theory/diatonic'
import type { SongDoc, SongNote, SongChord } from '@/types/song'

export type Rng = () => number
export type Level = 1 | 2 | 3

const EPS = 1e-6

// ── Seeded PRNG (mulberry32) — same shape as lib/gehor/exercises ──────────────

/** Hash an arbitrary seed (string/number/undefined) down to a 32-bit int. */
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

/** mulberry32 — small, fast, deterministic PRNG returning floats in [0, 1). */
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

function randInt(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1))
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ── Level configuration ──────────────────────────────────────────────────────

interface KeyChoice {
  tonicPc: number
  keySignature: string // must match /^[A-Ga-g][#b]?$/
}

interface MeterChoice {
  timeSignature: string
  beatsPerBar: number // quarter-note beats per bar (6/8 → 3)
}

interface LevelConfig {
  keys: KeyChoice[]
  meters: MeterChoice[]
  bars: number
  /** Max melodic leap between consecutive notes, in diatonic scale steps. */
  maxLeap: number
  /** Highest scale degree the melody may reach (0 = tonic; 4 = a fifth above; 7
   * = the octave). Level 1 stays inside the C4–G4 pentachord. */
  hiClamp: number
  /** Add a left-hand accompaniment (chord roots) + a chord track. */
  leftHand: boolean
  /** Chance of an anacrusis (1-beat pickup). */
  pickup: boolean
}

const CONFIG: Record<Level, LevelConfig> = {
  1: {
    keys: [{ tonicPc: 0, keySignature: 'C' }],
    meters: [{ timeSignature: '4/4', beatsPerBar: 4 }],
    bars: 4,
    maxLeap: 1, // stepwise only (maks sekund-sprang)
    hiClamp: 4, // C4–G4
    leftHand: false,
    pickup: false,
  },
  2: {
    keys: [
      { tonicPc: 0, keySignature: 'C' },
      { tonicPc: 5, keySignature: 'F' },
      { tonicPc: 7, keySignature: 'G' },
    ],
    meters: [{ timeSignature: '4/4', beatsPerBar: 4 }],
    bars: 6,
    maxLeap: 4, // leaps up to a perfect fifth
    hiClamp: 7,
    leftHand: false,
    pickup: true,
  },
  3: {
    keys: [
      { tonicPc: 3, keySignature: 'Eb' },
      { tonicPc: 2, keySignature: 'D' },
      { tonicPc: 9, keySignature: 'A' },
    ],
    meters: [
      { timeSignature: '4/4', beatsPerBar: 4 },
      { timeSignature: '3/4', beatsPerBar: 3 },
      { timeSignature: '6/8', beatsPerBar: 3 },
    ],
    bars: 8,
    maxLeap: 4,
    hiClamp: 7,
    leftHand: true,
    pickup: false,
  },
}

// ── Rhythm ────────────────────────────────────────────────────────────────────
// A pool of durations (in quarter-note beats). Every pool's smallest value
// divides the bar and every value is a multiple of that smallest unit, so greedy
// filling can never get stuck with an unfillable remainder.

function rhythmPool(level: Level, timeSignature: string): number[] {
  if (level === 1) return [1, 2, 4] // quarter, half, whole
  if (level === 2) return [0.5, 1, 2] // + eighths
  // Level 3 depends on the meter.
  if (timeSignature === '6/8') return [0.5, 1.5] // eighths + dotted quarters
  return [0.5, 1, 2]
}

/** Greedily fill `beats` with durations drawn from `pool`. */
function fillBar(rng: Rng, beats: number, pool: number[]): number[] {
  const out: number[] = []
  let rem = beats
  while (rem > EPS) {
    const allowed = pool.filter((d) => d <= rem + EPS)
    const d = pick(rng, allowed)
    out.push(d)
    rem -= d
  }
  return out
}

// ── Melody walk ───────────────────────────────────────────────────────────────

/** Choose a resolved final scale degree: the tonic-triad tone nearest to the
 * previous note's degree, constrained to be within `maxLeap` steps so the
 * closing interval never exceeds the level's leap limit. The triad set is dense
 * enough that a candidate within `maxLeap` always exists. */
function resolveFinalDegree(prevDeg: number, triad: number[], maxLeap: number): number {
  let best = prevDeg
  let bestErr = Infinity
  for (const t of triad) {
    const err = Math.abs(t - prevDeg)
    if (err > maxLeap) continue
    if (err < bestErr) {
      bestErr = err
      best = t
    }
  }
  return best
}

// ── Generator ─────────────────────────────────────────────────────────────────

interface BarSpan {
  start: number
  beats: number
  isPickup: boolean
}

/**
 * Generate one reading exercise as a valid SongDoc.
 *   Level 1 — C major, right hand only, stepwise, whole/half/quarter, 4/4, the
 *             melody stays inside C4–G4, 4 bars.
 *   Level 2 — C/F/G major, leaps up to a fifth, + eighths, optional 1-beat
 *             pickup, 6 bars.
 *   Level 3 — Eb/D/A major, + a left-hand chord-root part and a chord track,
 *             4/4 · 3/4 · 6/8, 8 bars.
 *
 * Deterministic in `rng`; output always passes songDocSchema + docInvariants.
 */
export function generateReadingExercise(level: Level, rng: Rng): SongDoc {
  const cfg = CONFIG[level]
  const key = pick(rng, cfg.keys)
  const meter = pick(rng, cfg.meters)
  const { beatsPerBar, timeSignature } = meter
  const scale = scalePitches(key.tonicPc, 'major')
  const triads = diatonicTriads(key.tonicPc, 'major')

  // Anchor the tonic near middle C so the melody sits in the treble staff.
  let tonicMidi = 60 + key.tonicPc
  if (tonicMidi > 67) tonicMidi -= 12

  // A scale degree (0 = tonic, may exceed 7 for the octave) → MIDI pitch.
  const degreeToMidi = (d: number): number => {
    const octave = Math.floor(d / 7)
    const pc = scale[((d % 7) + 7) % 7]
    const base = tonicMidi + 12 * octave
    return base + pitchClass(pc - tonicMidi)
  }

  // ── Lay out the bars (a short pickup measure + full bars) ──────────────────
  const usePickup = cfg.pickup && rng() < 0.5
  const pickupBeats = usePickup ? 1 : 0
  const spans: BarSpan[] = []
  let cursor = 0
  if (usePickup) {
    spans.push({ start: 0, beats: pickupBeats, isPickup: true })
    cursor = pickupBeats
  }
  for (let i = 0; i < cfg.bars; i++) {
    spans.push({ start: cursor, beats: beatsPerBar, isPickup: false })
    cursor += beatsPerBar
  }
  const totalBeats = cursor

  // ── Right-hand rhythm across every span → onsets ───────────────────────────
  const pool = rhythmPool(level, timeSignature)
  const rhythm: { t: number; d: number }[] = []
  for (const span of spans) {
    let t = span.start
    for (const d of fillBar(rng, span.beats, pool)) {
      rhythm.push({ t, d })
      t += d
    }
  }

  // ── Right-hand pitches (a bounded diatonic walk) ───────────────────────────
  const n = rhythm.length
  const triadDegrees = cfg.hiClamp <= 4 ? [0, 2, 4] : [0, 2, 4, 7]
  let deg = randInt(rng, 0, 4) // start inside C4–G4
  const degrees: number[] = [deg]
  for (let i = 1; i < n; i++) {
    let step = 0
    while (step === 0) step = randInt(rng, -cfg.maxLeap, cfg.maxLeap)
    deg = Math.max(0, Math.min(cfg.hiClamp, deg + step))
    degrees.push(deg)
  }
  // Resolve the last note onto a tonic-triad tone, relative to the previous
  // note so the closing interval stays within the level's leap limit.
  if (n > 1) {
    degrees[n - 1] = resolveFinalDegree(degrees[n - 2], triadDegrees, cfg.maxLeap)
  } else {
    degrees[0] = resolveFinalDegree(degrees[0], triadDegrees, cfg.maxLeap)
  }

  const notes: SongNote[] = rhythm.map((r, i) => ({
    p: degreeToMidi(degrees[i]),
    t: r.t,
    d: r.d,
    h: 'R' as const,
  }))

  // ── Left hand + chord track (level 3) ──────────────────────────────────────
  const chords: SongChord[] = []
  if (cfg.leftHand) {
    // I, IV, V, vi — a plain diatonic pool; first and last bar are the tonic.
    const progression = [0, 3, 4, 5]
    const fullBars = spans.filter((s) => !s.isPickup)
    fullBars.forEach((bar, i) => {
      const idx =
        i === 0 || i === fullBars.length - 1 ? 0 : pick(rng, progression)
      const triad = triads[idx]
      // Bass note: the chord root voiced around C3 (48–59).
      let bass = 48 + triad.root
      if (bass > 55) bass -= 12
      // One dotted whole-bar note, or (in 4/4) two half notes.
      if (beatsPerBar === 4 && rng() < 0.5) {
        notes.push({ p: bass, t: bar.start, d: 2, h: 'L' })
        notes.push({ p: bass, t: bar.start + 2, d: 2, h: 'L' })
      } else {
        notes.push({ p: bass, t: bar.start, d: beatsPerBar, h: 'L' })
      }
      chords.push({ t: bar.start, d: beatsPerBar, r: triad.root, q: triad.quality })
    })
  }

  return {
    formatVersion: 1,
    timeSignature,
    beatsPerBar,
    pickupBeats,
    totalBeats,
    keySignature: key.keySignature,
    sections: [
      {
        id: 'v1',
        kind: 'verse',
        label: 'Oppgave',
        startBeat: 0,
        endBeat: totalBeats,
      },
    ],
    notes,
    chords,
  }
}
