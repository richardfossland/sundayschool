'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Music } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { hymnStoryFor } from '@/lib/teologi/content'

// ── Salmehistorie-artikkel ────────────────────────────────────────────────────
// One editorial article about the hymn behind a song. bodyMd is markdown-lite:
// blank-line paragraphs and '### ' subheadings only, rendered by the tiny
// parser below (no markdown dependency). Sources + rights at the foot, and a
// link across to the song on the piano side.

/** Split markdown-lite into renderable blocks. */
function parseBody(bodyMd: string): { kind: 'h3' | 'p'; text: string }[] {
  return bodyMd
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith('### ')
        ? ({ kind: 'h3', text: block.slice(4).trim() } as const)
        : ({ kind: 'p', text: block } as const),
    )
}

export default function SalmehistoriePage() {
  const params = useParams<{ slug: string }>()
  const story = hymnStoryFor(params.slug)

  return (
    <AppShell>
      <main
        className="mx-auto max-w-3xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-teologi)' }}
      >
        <Link
          href="/teologi"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Teologi
        </Link>

        {!story ? (
          <div className="py-24 text-center">
            <h1 className="font-display text-2xl text-[var(--color-ivory)]">
              Fant ikke artikkelen
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-[var(--color-muted)]">
              Det finnes ingen salmehistorie for denne sangen.
            </p>
          </div>
        ) : (
          <article className="mt-4">
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--fag-teologi)' }}
            >
              Salmehistorie
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-[var(--color-ivory)] sm:text-4xl">
              {story.title}
            </h1>

            <div className="mt-6 space-y-5">
              {parseBody(story.bodyMd).map((block, i) =>
                block.kind === 'h3' ? (
                  <h2
                    key={i}
                    className="pt-2 font-display text-xl text-[var(--color-ivory)] sm:text-2xl"
                  >
                    {block.text}
                  </h2>
                ) : (
                  <p key={i} className="leading-relaxed text-[var(--color-ivory)]/85">
                    {block.text}
                  </p>
                ),
              )}
            </div>

            <Link
              href={`/piano/sang/${story.songSlug}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 16%, transparent)',
                color: 'var(--fag-teologi)',
              }}
            >
              <Music className="h-4 w-4" />
              Øv sangen på Piano
            </Link>

            {/* sources + rights */}
            <footer className="mt-10 border-t border-[var(--color-border)] pt-5">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                Kilder
              </h2>
              <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                {story.sources.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                {story.rights.source}
                {story.rights.notes ? ` — ${story.rights.notes}` : ''}
              </p>
            </footer>
          </article>
        )}
      </main>
    </AppShell>
  )
}
