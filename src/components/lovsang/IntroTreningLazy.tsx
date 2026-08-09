'use client'

import dynamic from 'next/dynamic'
import type { Song } from '@/types/song'

// Intro practice drives the SongEngine (Tone). Loaded on demand — see
// GiTonenLazy / SongPlayerLazy.
const IntroTreningInner = dynamic(() => import('./IntroTrening').then((m) => m.IntroTrening), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ minHeight: 64 }}
      aria-hidden
    />
  ),
})

export function IntroTreningLazy(props: {
  song: Song | null
  workSlug: string
  targetKey: number
}) {
  return <IntroTreningInner {...props} />
}
