// ── Spaced repetition (Teologi / memory verses) ───────────────────────────────
// A deliberately simple Leitner-style scheduler (a stripped-down SM-2). Each
// verse lives in a box 1–5; getting it right on review promotes it one box and
// pushes the next due date out by that box's interval, getting it wrong drops it
// back to box 1 (due tomorrow). The scheduling functions are PURE — state in,
// state out, `today` passed explicitly (no clock, no storage) so they are fully
// testable. A thin localStorage wrapper lives at the bottom for the UI.

/** Interval per box, in days. Box 1 = 1 day … box 5 = 30 days. Index 0 is a
 * placeholder so BOX_INTERVALS[box] reads naturally (box is 1-based). */
export const BOX_INTERVALS = [0, 1, 3, 7, 14, 30] as const
export const MIN_BOX = 1
export const MAX_BOX = 5

/** Per-verse scheduling record. */
export interface SrCard {
  /** Current Leitner box, 1–5. */
  box: number
  /** Next due date, LOCAL 'YYYY-MM-DD'. */
  due: string
  /** Total number of reviews performed. */
  reps: number
}

/** id → card. A verse with no entry has never been reviewed and counts as due. */
export type SrState = Record<string, SrCard>

const STORAGE_KEY = 'sundayschool_sr'

/** Today's LOCAL date as 'YYYY-MM-DD'. Local calendar parts on purpose — same
 * reasoning as progress.ts (UTC would roll the day over at the wrong moment in
 * Norway). Exposed so callers/tests share one implementation. */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Add `days` to a 'YYYY-MM-DD' date and return 'YYYY-MM-DD'. Uses UTC math on a
 * date-only value so it never drifts across DST. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return todayKeyFromUTC(dt)
}

function todayKeyFromUTC(dt: Date): string {
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** True when a card is due on/before `today` (or has never been seen). */
export function isDue(state: SrState, id: string, today: string): boolean {
  const card = state[id]
  if (!card) return true
  return card.due <= today
}

/** The subset of `ids` (defaults to every id in state) due on/before `today`.
 * Order follows the input `ids` when given, otherwise state key order. */
export function dueVerses(state: SrState, today: string, ids?: string[]): string[] {
  const pool = ids ?? Object.keys(state)
  return pool.filter((id) => isDue(state, id, today))
}

/** Review one verse. Pure: returns a NEW state, never mutates the input.
 *   correct → box+1 (capped at 5), due = today + that box's interval, reps+1
 *   wrong   → box 1, due = tomorrow, reps+1
 * A verse reviewed for the first time is treated as starting in box 1. */
export function review(state: SrState, id: string, correct: boolean, today: string): SrState {
  const prev = state[id]
  const prevBox = prev?.box ?? MIN_BOX
  const reps = (prev?.reps ?? 0) + 1

  let box: number
  if (correct) {
    box = Math.min(prevBox + 1, MAX_BOX)
  } else {
    box = MIN_BOX
  }
  const due = addDays(today, BOX_INTERVALS[box])

  return { ...state, [id]: { box, due, reps } }
}

// ── Thin localStorage wrapper (UI side) ───────────────────────────────────────
// Pure functions above do the work; these just persist SrState under one key.

export function loadSr(): SrState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as SrState
  } catch {
    return {}
  }
}

export function saveSr(state: SrState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage full / blocked — ignore */
  }
}
