'use client'

import dynamic from 'next/dynamic'
import type { Groove } from '@/lib/drums/types'

// GroovePlayer pulls in Tone.js (via the engine) and paints a live <canvas>, so
// it must never be server-rendered — same pattern as SongPlayerLazy.
const GroovePlayerInner = dynamic(() => import('./GroovePlayer').then((m) => m.GroovePlayer), {
  ssr: false,
  loading: () => (
    <div
      className="animate-fade-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ height: 560 }}
      aria-hidden
    />
  ),
})

export function GroovePlayerLazy({ groove }: { groove: Groove }) {
  return <GroovePlayerInner groove={groove} />
}
