import type { Groove } from '@/lib/drums/types'
import {
  salmeEnkel,
  gospel8,
  worshipPop16,
  ballade,
  halftime,
  trainBeat,
  gospelShout,
} from './grooves-44.ts'
import { vals, ballade68, gospelShuffle128 } from './grooves-triple.ts'
import { fillSnare, fillTommer, fillTrioler } from './fills.ts'

// ── Groove library ────────────────────────────────────────────────────────────
// Curated, hand-written grooves for the Trommer fag. GROOVES are the loopable
// beats shown in the library grid; FILLS are one-bar fills (also practisable on
// their own, and swapped in by the drum-track generator before section
// boundaries). ALL_PATTERNS is the flat lookup the /trommer/groove/[id] route
// resolves against.

export const GROOVES: Groove[] = [
  salmeEnkel,
  gospel8,
  ballade,
  vals,
  ballade68,
  worshipPop16,
  halftime,
  trainBeat,
  gospelShuffle128,
  gospelShout,
]

export const FILLS: Groove[] = [fillSnare, fillTommer, fillTrioler]

export const ALL_PATTERNS: Groove[] = [...GROOVES, ...FILLS]

export function grooveById(id: string): Groove | null {
  return ALL_PATTERNS.find((g) => g.id === id) ?? null
}
