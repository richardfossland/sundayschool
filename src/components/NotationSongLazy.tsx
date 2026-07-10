'use client'

import dynamic from 'next/dynamic'

// VexFlow is by far the heaviest dependency in the app and is only needed to draw
// sheet music. A full-song grand staff is heavier still, so we keep it out of the
// initial bundle: it loads on demand the first time a score renders (ssr:false —
// VexFlow needs the DOM). The placeholder reserves the scroll box's height to
// avoid layout shift (CLS). Import this wherever the score is shown.
export const NotationSong = dynamic(() => import('./NotationSong').then((m) => m.NotationSong), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ height: 200 }}
      aria-hidden
    />
  ),
})
