'use client'

import dynamic from 'next/dynamic'

// Pulls the SongEngine (and therefore Tone) — keep it off the teori routes'
// critical path. See MikserSimLazy / SongPlayerLazy.
const ChordBuilderInner = dynamic(() => import('./ChordBuilder').then((m) => m.ChordBuilder), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ minHeight: 260 }}
      aria-hidden
    />
  ),
})

export function ChordBuilderLazy() {
  return <ChordBuilderInner />
}
