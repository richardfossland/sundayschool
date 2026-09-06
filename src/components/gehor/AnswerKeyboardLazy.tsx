'use client'

import dynamic from 'next/dynamic'
import { LazyPlaceholder } from '@/components/LazyPlaceholder'

// The melody-dictation answer surface, held out of /gehor's first load. It is
// the only part of the gehør menu that reaches the engine (and through it Tone)
// plus the full on-screen keyboard — and it is only ever shown once a melody
// session is running. The exercise card itself stays eager: it is buttons.
//
// ssr:false — the keyboard measures itself and the engine needs an AudioContext.

// MEASURED at 1280 px: the prompt line plus the two-octave keyboard the melody
// is answered on. Nothing renders below it inside the card, so the reserve is
// about the slot looking right, not about rescuing a score.
const KEYBOARD_HEIGHT = 214

export const AnswerKeyboard = dynamic(
  () => import('./AnswerKeyboard').then((m) => m.AnswerKeyboard),
  { ssr: false, loading: () => <LazyPlaceholder height={KEYBOARD_HEIGHT} /> },
)

/** Warm the keyboard chunk when a session starts, so the first melody task does
 * not open on a placeholder. Idempotent. */
export function preloadAnswerKeyboard() {
  void import('./AnswerKeyboard')
}
