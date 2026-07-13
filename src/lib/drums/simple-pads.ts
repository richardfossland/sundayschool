// ── Simplified drum kit ("Enkle pads") ────────────────────────────────────────
// A beginner mode that trades the full nine-lane kit for four big pads: kick,
// snare, hi-hat and crash. This module owns the two facts that mode needs — the
// four lane indices, and whether a groove can be played on them — plus the
// hydration-safe localStorage flag both the player and the library read. Kept
// separate from drum-track.ts (the pure generator) so UI state stays out of it.

import type { DrumHit } from './types'
import { lanesUsed } from './drum-track'

/** The four lanes of the simplified kit: kick (0), snare (1), hi-hat (2),
 * crash (7). Ordered for the 2×2 pad grid. */
export const SIMPLE_LANES = [0, 1, 2, 7] as const

const SIMPLE_SET = new Set<number>(SIMPLE_LANES)

/** A groove fits the simplified kit when every lane it uses is one of the four
 * simple pads — so the beginner never faces a target they have no pad for. */
export function fitsSimplePads(hits: DrumHit[]): boolean {
  for (const lane of lanesUsed(hits)) {
    if (!SIMPLE_SET.has(lane)) return false
  }
  return true
}

const STORAGE_KEY = 'trommer:pads-enkel'

/** Read the persisted "enkle pads" preference. Safe on the server (returns
 * false) — callers MUST read this in an effect, not during render, to avoid a
 * hydration mismatch. */
export function readSimplePads(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Persist the "enkle pads" preference. */
export function writeSimplePads(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
  } catch {
    // Ignore — private mode / storage disabled just means the toggle won't stick.
  }
}
