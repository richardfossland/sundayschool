'use client'

import dynamic from 'next/dynamic'
import type { Song } from '@/types/song'

// SongPlayer pulls in Tone.js (via the engine) and paints a live <canvas>, so it
// must never be server-rendered. Loading it dynamically with ssr:false keeps
// Tone out of the server bundle and off the initial critical path; a fixed-height
// placeholder avoids layout shift while the client chunk arrives. W6 imports THIS
// wherever a song is played.
const SongPlayerInner = dynamic(() => import('./SongPlayer').then((m) => m.SongPlayer), {
  ssr: false,
  loading: () => (
    <div
      className="animate-fade-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ height: 560 }}
      aria-hidden
    />
  ),
})

export function SongPlayerLazy({ song }: { song: Song }) {
  return <SongPlayerInner song={song} />
}
