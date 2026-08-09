'use client'

import dynamic from 'next/dynamic'
import type { Song } from '@/types/song'

// «Gi tonen» plays through the SongEngine, which imports Tone. Loaded on demand
// so /lovsang's first load is a setlist editor, not an audio engine.
const GiTonenInner = dynamic(() => import('./GiTonen').then((m) => m.GiTonen), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ minHeight: 64 }}
      aria-hidden
    />
  ),
})

export function GiTonenLazy(props: { song: Song | null; targetKey: number }) {
  return <GiTonenInner {...props} />
}
