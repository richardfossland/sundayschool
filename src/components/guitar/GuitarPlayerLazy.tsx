'use client'

import dynamic from 'next/dynamic'
import type { Song } from '@/types/song'

// GuitarPlayer pulls in Tone.js (via the engine) and paints a live <canvas>, so
// it must never be server-rendered — same pattern as SongPlayerLazy. A fixed-
// height placeholder avoids layout shift while the client chunk arrives.
const GuitarPlayerInner = dynamic(() => import('./GuitarPlayer').then((m) => m.GuitarPlayer), {
  ssr: false,
  loading: () => (
    <div
      className="animate-fade-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ height: 560 }}
      aria-hidden
    />
  ),
})

export function GuitarPlayerLazy({ song }: { song: Song }) {
  return <GuitarPlayerInner song={song} />
}
