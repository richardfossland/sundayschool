'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { SUBJECTS } from '@/lib/subjects'
import { cn } from '@/lib/cn'

// ── AppShell ─────────────────────────────────────────────────────────────────
// The single topbar every route wraps its content in. It renders ONLY the
// header — each page owns its own <main> and layout.
//
//   export default function Page() {
//     return (
//       <AppShell>
//         <main className="mx-auto max-w-5xl px-4 py-10">…</main>
//       </AppShell>
//     )
//   }
//
// Skolen v2 nav: the primary subjects sit in a horizontally-scrollable row
// (mobile-first — it never wraps or overflows the viewport), and the secondary
// items (Teori, Gehør, Om rettigheter) live behind a "Mer" dropdown.

const PRIMARY = SUBJECTS.filter((s) => s.tier === 'primary')
const SECONDARY = SUBJECTS.filter((s) => s.tier === 'secondary')

const MORE_LINKS: { href: string; label: string }[] = [
  ...SECONDARY.map((s) => ({ href: s.href, label: s.label })),
  { href: '/om-rettigheter', label: 'Om rettigheter' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const moreActive = MORE_LINKS.some((l) => isActive(l.href))

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-scene)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-scene)]/80">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-display text-lg text-[var(--color-amber)] sm:text-xl"
          >
            <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-amber)]/15 text-sm">
              ♪
            </span>
            SundaySchool
          </Link>

          <nav
            aria-label="Fag"
            className="scroll-x -mx-1 flex min-w-0 flex-1 items-center gap-1 px-1 sm:gap-1.5"
          >
            {PRIMARY.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  style={active ? { color: item.accent } : undefined}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5',
                    active
                      ? 'bg-[var(--color-surface)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Mer-dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5',
                moreActive || moreOpen
                  ? 'bg-[var(--color-surface)] text-[var(--color-ivory)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
              )}
            >
              Mer
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', moreOpen && 'rotate-180')}
                aria-hidden
              />
            </button>

            {moreOpen && (
              <>
                {/* click-outside catcher */}
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMoreOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
                >
                  {MORE_LINKS.map((l) => {
                    const active = isActive(l.href)
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'block px-4 py-2 text-sm transition-colors',
                          active
                            ? 'bg-[var(--color-raised)] text-[var(--color-amber)]'
                            : 'text-[var(--color-muted)] hover:bg-[var(--color-raised)] hover:text-[var(--color-ivory)]',
                        )}
                      >
                        {l.label}
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
