'use client'

import dynamic from 'next/dynamic'

// MikserSim builds a Web Audio graph and imports Tone (for the shared, already
// unlocked AudioContext), so a static import pulled ~57 kB gz of Tone into every
// lydteknikk route's first load — before the learner has pressed anything. Same
// treatment as SongPlayerLazy: client-only, loaded on demand, with a
// fixed-height placeholder so nothing shifts. Pages import THIS.
const MikserSimInner = dynamic(() => import('./MikserSim').then((m) => m.MikserSim), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]"
      style={{ minHeight: 420 }}
    >
      Laster miksepult …
    </div>
  ),
})

export function MikserSimLazy() {
  return <MikserSimInner />
}
