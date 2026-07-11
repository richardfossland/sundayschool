'use client'

import dynamic from 'next/dynamic'
import type { Song } from '@/types/song'

// DrumsPlayer pulls in Tone.js (via the engine) and paints a live <canvas>, so
// it must never be server-rendered — same pattern as SongPlayerLazy.
const DrumsPlayerInner = dynamic(() => import('./DrumsPlayer').then((m) => m.DrumsPlayer), {
  ssr: false,
  loading: () => (
    <div
      className="animate-fade-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ height: 560 }}
      aria-hidden
    />
  ),
})

export function DrumsPlayerLazy({ song }: { song: Song }) {
  return <DrumsPlayerInner song={song} />
}
