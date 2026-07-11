'use client'

import dynamic from 'next/dynamic'
import type { Song } from '@/types/song'

// BassPlayer pulls in Tone.js (via the engine) and paints a live <canvas>, so
// it must never be server-rendered — same pattern as SongPlayerLazy.
const BassPlayerInner = dynamic(() => import('./BassPlayer').then((m) => m.BassPlayer), {
  ssr: false,
  loading: () => (
    <div
      className="animate-fade-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ height: 560 }}
      aria-hidden
    />
  ),
})

export function BassPlayerLazy({ song }: { song: Song }) {
  return <BassPlayerInner song={song} />
}
