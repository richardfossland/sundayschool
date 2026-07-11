import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { hymnStoryFor } from '@/lib/teologi/content'

// ── HymnStoryLink ─────────────────────────────────────────────────────────────
// A small cross-link from a song to its theology article ("Historien bak
// salmen"). Renders nothing when the song has no story, so callers can drop it in
// unconditionally. Only `hymnStoryFor` is imported — a single lookup over the
// bundled, client-safe teologi data — so the player page stays light.

export function HymnStoryLink({ slug }: { slug: string }) {
  const story = hymnStoryFor(slug)
  if (!story) return null

  return (
    <Link
      href={`/teologi/salmehistorie/${story.songSlug}`}
      style={{ ['--fag' as string]: 'var(--fag-teologi)' }}
      className="group mt-6 flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--fag)]"
    >
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
          color: 'var(--fag)',
        }}
      >
        <BookOpen className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          Teologi
        </span>
        <span className="block font-medium text-[var(--color-ivory)]">Historien bak salmen</span>
      </span>
      <ArrowRight
        aria-hidden
        className="h-4 w-4 shrink-0 text-[var(--fag)] transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}
