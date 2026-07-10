'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

// ── AppShell ─────────────────────────────────────────────────────────────────
// The single topbar every route wraps its content in (SundaySchool has no
// per-mode chrome like SundayLicks, so this is deliberately simpler). It renders
// ONLY the header — each page owns its own <main> and layout.
//
//   export default function Page() {
//     return (
//       <AppShell>
//         <main className="mx-auto max-w-5xl px-4 py-10">…</main>
//       </AppShell>
//     )
//   }

const NAV: { href: string; label: string }[] = [
  { href: '/bibliotek', label: 'Bibliotek' },
  { href: '/egen-midi', label: 'Egen MIDI' },
  { href: '/om-rettigheter', label: 'Om rettigheter' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-scene)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-scene)]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-display text-lg text-[var(--color-amber)] sm:text-xl"
          >
            <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-amber)]/15 text-sm">
              ♪
            </span>
            SundaySchool
          </Link>

          <nav aria-label="Hovedmeny" className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4',
                    active
                      ? 'bg-[var(--color-amber)]/15 text-[var(--color-amber)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {children}
    </div>
  )
}
