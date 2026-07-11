import type { HitResult } from './types'

// ── Hit-timing classification (pure) ─────────────────────────────────────────
// The drum trainer judges every strike against its target beat. Windows are in
// MILLISECONDS (what a human perceives), so the beat distance is converted via
// the live bpm: the same ±40 ms feels identical at 60 and 160 BPM even though
// it is a very different fraction of a beat.

/** ± window for a 'perfect' hit, ms. */
export const PERFECT_MS = 40
/** ± window for an 'early'/'late' (still counted) hit, ms. Beyond this: miss. */
export const GOOD_MS = 100

/**
 * Classify one strike. `hitBeatActual` is the transport beat when the player
 * struck; `targetBeat` the groove hit it is judged against. Early = struck
 * before the target, late = after.
 */
export function classifyHit(hitBeatActual: number, targetBeat: number, bpm: number): HitResult {
  const msPerBeat = 60000 / bpm
  const deltaMs = (hitBeatActual - targetBeat) * msPerBeat
  // Tiny tolerance so a hit exactly ON a window edge (in beats) is not pushed
  // out by float rounding of the beats→ms conversion.
  const abs = Math.abs(deltaMs) - 1e-6
  if (abs <= PERFECT_MS) return 'perfect'
  if (abs <= GOOD_MS) return deltaMs < 0 ? 'early' : 'late'
  return 'miss'
}

export interface SessionScore {
  perfect: number
  early: number
  late: number
  miss: number
  /** Weighted accuracy 0–100: perfect = 1, early/late = ½, miss = 0. */
  pct: number
}

/** Aggregate a session's per-hit results into the summary the UI shows. */
export function scoreSession(results: HitResult[]): SessionScore {
  const s: SessionScore = { perfect: 0, early: 0, late: 0, miss: 0, pct: 0 }
  for (const r of results) s[r]++
  const total = results.length
  if (total > 0) {
    s.pct = Math.round(((s.perfect + 0.5 * (s.early + s.late)) / total) * 100)
  }
  return s
}
