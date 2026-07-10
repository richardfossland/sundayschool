import type { Hand, HandFilter, SongDoc, SongNote } from '@/types/song'

// ── Pure, Tone-free score → event helpers ────────────────────────────────────
// These turn a SongDoc's semantic notes into a flat, sounding-note event list
// and compute the count-in/downbeat grid. Kept free of Tone.js so they can be
// unit-tested in a plain Node env (engine.ts consumes them and wraps Tone).

const EPS = 1e-6

/** A single sounding event, in BEATS. engine.ts converts beats → Transport
 * ticks; nothing here depends on tempo or Tone. */
export interface EngineEvent {
  beat: number // start, in beats from beat 0
  pitch: number // MIDI pitch (already transposed)
  durBeats: number // sounding duration, in beats (tie chains already merged)
  vel: number // velocity 0–1
  hand: Hand
}

/**
 * Merge tied note pairs (and chains) into one sounding note of combined
 * duration. A `tie` is NOTATION ONLY — it binds to the NEXT note of the same
 * pitch+hand whose start meets this note's end (see types/song.ts). Playback
 * must sound them as a single held note. Input is not mutated; the returned
 * notes have `tie` cleared. Notes that are the continuation ("tail") of a tie
 * are dropped from the output because they were absorbed into the head.
 */
export function mergeTies(notes: SongNote[]): SongNote[] {
  // The continuation of a tie: the first later note with same pitch+hand that
  // starts exactly where `n` ends. (d > 0, so a note can never match itself.)
  const findNext = (n: SongNote): number =>
    notes.findIndex(
      (m) => m.p === n.p && m.h === n.h && Math.abs(m.t - (n.t + n.d)) < EPS,
    )

  // First pass: every note that is some tie's continuation is a "tail" and must
  // not be emitted on its own (it is folded into the head of its chain).
  const tail = new Set<number>()
  for (const n of notes) {
    if (!n.tie) continue
    const j = findNext(n)
    if (j >= 0) tail.add(j)
  }

  const out: SongNote[] = []
  for (let i = 0; i < notes.length; i++) {
    if (tail.has(i)) continue // absorbed into an earlier head
    const head = notes[i]
    if (!head.tie) {
      out.push(head)
      continue
    }
    // Walk the chain accumulating duration; guard against cycles.
    let dur = head.d
    let node: SongNote = head
    const seen = new Set<number>([i])
    while (node.tie) {
      const j = findNext(node)
      if (j < 0 || seen.has(j)) break
      seen.add(j)
      dur += notes[j].d
      node = notes[j]
    }
    out.push({ ...head, d: dur, tie: undefined })
  }
  return out
}

export interface BuildEventsOptions {
  hand: HandFilter
  /** Semitone offset applied to every pitch (transposition). Default 0. */
  transpose?: number
  /** When set and a note belongs to the NON-selected hand, keep it at this
   * velocity instead of dropping it (per-hand / band practice). Undefined =
   * the muted hand is silent (omitted entirely). */
  mutedHandVelocity?: number
}

/**
 * Flatten a SongDoc into sounding events: merge ties, apply the hand filter
 * (optionally keeping the muted hand at a low velocity), and transpose. Only
 * `doc.notes` is read, so tests can pass a minimal `{ notes }`.
 */
export function buildEvents(doc: Pick<SongDoc, 'notes'>, opts: BuildEventsOptions): EngineEvent[] {
  const offset = opts.transpose ?? 0
  const merged = mergeTies(doc.notes)
  const events: EngineEvent[] = []
  for (const n of merged) {
    const selected = opts.hand === 'both' || n.h === opts.hand
    let vel = n.v ?? 0.8
    if (!selected) {
      if (opts.mutedHandVelocity === undefined) continue // muted hand is silent
      vel = opts.mutedHandVelocity
    }
    events.push({ beat: n.t, pitch: n.p + offset, durBeats: n.d, vel, hand: n.h })
  }
  return events
}

export interface CountInPlan {
  /** One full bar of clicks, as beat offsets from the count-in start. The first
   * is accented (the downbeat). */
  clicks: { beat: number; accent: boolean }[]
  /** How many beats after the count-in start the transport should begin (so the
   * pickup, if any, occupies the tail of the count-in bar and bar 1's downbeat
   * lands exactly one bar after the accent). */
  startAfterBeats: number
}

/**
 * Count-in = exactly one full bar of `beatsPerBar` clicks, accent on beat 1.
 * With a pickup (opptakt), playback (transport beat 0 = first pickup note) must
 * begin `beatsPerBar - pickupBeats` beats into the count-in bar, so the pickup
 * fills the end of the bar and the first true downbeat (beat = pickupBeats) is
 * one whole bar after the count-in accent — the click grid stays continuous.
 */
export function countInClicks(beatsPerBar: number, pickupBeats: number): CountInPlan {
  const n = Math.max(1, Math.round(beatsPerBar))
  const clicks = Array.from({ length: n }, (_, i) => ({ beat: i, accent: i === 0 }))
  return { clicks, startAfterBeats: beatsPerBar - pickupBeats }
}

/**
 * Is `beat` a bar downbeat, accounting for the pickup? Downbeats fall on
 * beat = pickupBeats + k·beatsPerBar. Used to accent the live metronome.
 */
export function isDownbeat(beat: number, beatsPerBar: number, pickupBeats: number): boolean {
  if (beatsPerBar <= 0) return false
  const rel = beat - pickupBeats
  const m = ((rel % beatsPerBar) + beatsPerBar) % beatsPerBar
  return m < 1e-3 || beatsPerBar - m < 1e-3
}
