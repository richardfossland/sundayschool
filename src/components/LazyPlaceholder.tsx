'use client'

import { cn } from '@/lib/cn'

// The box a dynamically-imported component stands in while its chunk arrives.
// Its ONLY job is to be the same height as what replaces it: everything the
// audio subjects load late (the engine, Tone, VexFlow) sits below a menu the
// learner is still reading, so an unreserved slot would yank the page under
// their finger the moment the chunk lands.
//
// Deliberately empty rather than a spinner: these chunks resolve in a frame or
// two on a warm cache, and a flashing "laster …" is more noticeable than the
// pause it explains.
export function LazyPlaceholder({ height, className }: { height: number; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]',
        className,
      )}
      style={{ height }}
      aria-hidden
    />
  )
}
