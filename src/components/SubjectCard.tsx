import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Subject } from '@/lib/subjects'
import { cn } from '@/lib/cn'

// ── SubjectCard ───────────────────────────────────────────────────────────────
// One fag on the school launcher. `size` = 'lg' for the primary subjects,
// 'sm' for the secondary strip (Teori/Gehør). Active subjects glow in their
// accent; "kommer" subjects still link through (to a build-in-progress
// skeleton) but read as muted with a small badge. Accent is the subject's
// --fag-* CSS var, applied inline so the colour is fully data-driven.

export function SubjectCard({ subject, size = 'lg' }: { subject: Subject; size?: 'lg' | 'sm' }) {
  const { icon: Icon, label, tagline, href, accent, status } = subject
  const active = status === 'active'

  return (
    <Link
      href={href}
      style={{ ['--fag' as string]: accent }}
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-[var(--color-surface)] transition-colors',
        'border-[var(--color-border)] hover:border-[var(--fag)]',
        size === 'lg' ? 'p-6' : 'p-5',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          aria-hidden
          className={cn(
            'grid place-items-center rounded-xl',
            size === 'lg' ? 'h-12 w-12' : 'h-10 w-10',
          )}
          style={{ backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)', color: accent }}
        >
          <Icon className={size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
        </span>
        {active ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: 'color-mix(in srgb, var(--fag) 16%, transparent)', color: accent }}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            Åpen
          </span>
        ) : (
          <span className="rounded-full bg-[var(--color-raised)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
            Kommer
          </span>
        )}
      </div>

      <h2
        className={cn(
          'font-display text-[var(--color-ivory)] transition-colors',
          size === 'lg' ? 'text-2xl' : 'text-xl',
        )}
      >
        {label}
      </h2>
      <p className={cn('mt-1.5 text-[var(--color-muted)]', size === 'lg' ? 'text-sm' : 'text-sm')}>
        {tagline}
      </p>

      {active && (
        <span
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: accent }}
        >
          Åpne faget
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </Link>
  )
}
