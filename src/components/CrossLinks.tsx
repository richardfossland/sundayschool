import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// ── CrossLinks ────────────────────────────────────────────────────────────────
// A small, consistent row of "go deeper / go sideways" links at the foot of a
// fag-forside — e.g. from an instrument to Teori/Gehør, or from Teologi back to
// the song library. Pure presentation; each link is an internal href + label.

export interface CrossLink {
  href: string
  label: string
}

export function CrossLinks({ title = 'Gå videre', links }: { title?: string; links: CrossLink[] }) {
  if (links.length === 0) return null

  return (
    <section className="mt-12 border-t border-[var(--color-border)] pt-6">
      <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
        {title}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:border-[var(--color-amber)]"
            >
              {l.label}
              <ArrowRight className="h-3.5 w-3.5 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
