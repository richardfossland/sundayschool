'use client'

import { useEffect, useState } from 'react'
import { Check, CircleCheck } from 'lucide-react'
import { getProgress, recordPractice } from '@/lib/progress'
import { cn } from '@/lib/cn'

// ── LessonComplete ────────────────────────────────────────────────────────────
// The "Fullført"-button at the foot of every Lydteknikk lesson. Records local
// progress under the subject-prefixed key `lydteknikk:{slug}`. The bpm argument
// is meaningless for a read-only lesson, so we pass a fixed 100 (matching the
// brief) purely to mark the lesson as practised. Mounted-guarded so the "already
// done" state is read from localStorage only on the client.

export function LessonComplete({ slug }: { slug: string }) {
  const key = `lydteknikk:${slug}`
  const [mounted, setMounted] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDone(getProgress().practiced.includes(key))
  }, [key])

  const complete = () => {
    recordPractice(key, 100)
    setDone(true)
  }

  const isDone = mounted && done

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center">
      <button
        type="button"
        onClick={complete}
        aria-pressed={isDone}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
          isDone
            ? 'border border-[var(--color-border)] text-[var(--color-ivory)]'
            : 'text-[var(--color-scene)] hover:opacity-90',
        )}
        style={isDone ? undefined : { backgroundColor: 'var(--fag)' }}
      >
        {isDone ? <CircleCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        {isDone ? 'Fullført' : 'Marker som fullført'}
      </button>
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        {isDone
          ? 'Leksjonen er lagret som fullført på denne enheten.'
          : 'Lagrer fremgangen din lokalt på denne enheten.'}
      </p>
    </div>
  )
}
