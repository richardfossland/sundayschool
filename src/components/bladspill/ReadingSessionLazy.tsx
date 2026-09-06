'use client'

import dynamic from 'next/dynamic'
import { LazyPlaceholder } from '@/components/LazyPlaceholder'

// The bladspill trainer, held out of the route's first load. It pulls the
// engine and Tone, VexFlow (through NotationSong), the on-screen keyboard and
// Web MIDI — and the page shows a level-and-mode menu FIRST. Nobody reads that
// menu with a chunk of audio code, so the trainer arrives with the first click
// instead of with the page.
//
// ssr:false: the score needs the DOM and the engine needs an AudioContext.

// MEASURED at 1280 px on a nivå-1 exercise: score (two grand-staff systems) +
// status row + keyboard. The score grows with the exercise, so this is the
// typical case rather than an invariant — and the trainer is the last block on
// the route, so a miss shifts nothing above it.
const SESSION_HEIGHT = 720

export const ReadingSession = dynamic(
  () => import('./ReadingSession').then((m) => m.ReadingSession),
  { ssr: false, loading: () => <LazyPlaceholder height={SESSION_HEIGHT} /> },
)

/** Start fetching the trainer's chunk before it is mounted. The menu takes two
 * decisions (level, then mode), so warming it on the FIRST of them usually means
 * the session is already in memory when the second one lands. Safe to call more
 * than once — the module registry dedupes. */
export function preloadReadingSession() {
  void import('./ReadingSession')
}
