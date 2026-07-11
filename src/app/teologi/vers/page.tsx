'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookMarked, Check, RotateCcw } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { VerseCard } from '@/components/teologi/VerseCard'
import { verseCollections, versesByCollection } from '@/lib/teologi/content'
import type { MemoryVerse } from '@/types/teologi'
import { dueVerses, loadSr, review, saveSr, todayKey, type SrState } from '@/lib/teologi/sr'
import { recordPractice } from '@/lib/progress'

// ── Bibelvers — samlinger + øvingsflyt ────────────────────────────────────────
// Overview: the five themed collections with today's due counts. Picking one
// starts a session over its due verses (or, when nothing is due, an optional
// full run). Each answer goes through sr.review() and is persisted immediately;
// a finished session is recorded as practice under the `teologi:vers` key
// (recordPractice's bpm parameter is meaningless here — 0 by design).

type Session = {
  collectionId: string
  queue: MemoryVerse[]
  index: number
  remembered: number
}

export default function VersPage() {
  const [sr, setSr] = useState<SrState | null>(null) // null until mounted
  const [session, setSession] = useState<Session | null>(null)
  const [finished, setFinished] = useState<Session | null>(null)
  const today = todayKey()

  useEffect(() => setSr(loadSr()), [])

  const dueByCollection = useMemo(() => {
    if (!sr) return {}
    const out: Record<string, number> = {}
    for (const c of verseCollections) {
      out[c.id] = dueVerses(sr, today, c.verseIds).length
    }
    return out
  }, [sr, today])

  const start = (collectionId: string, all = false) => {
    if (!sr) return
    const verses = versesByCollection(collectionId)
    const queue = all ? verses : verses.filter((v) => dueVerses(sr, today, [v.id]).length > 0)
    if (queue.length === 0) return
    setFinished(null)
    setSession({ collectionId, queue, index: 0, remembered: 0 })
  }

  const answer = (correct: boolean) => {
    if (!session || !sr) return
    const verse = session.queue[session.index]
    const next = review(sr, verse.id, correct, today)
    saveSr(next)
    setSr(next)

    const advanced: Session = {
      ...session,
      index: session.index + 1,
      remembered: session.remembered + (correct ? 1 : 0),
    }
    if (advanced.index >= advanced.queue.length) {
      // Session complete — count it as today's theology practice.
      recordPractice('teologi:vers', 0)
      setSession(null)
      setFinished(advanced)
    } else {
      setSession(advanced)
    }
  }

  const current = session ? session.queue[session.index] : null
  const collectionLabel = (id: string) => verseCollections.find((c) => c.id === id)?.label ?? id

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

        <header className="mt-3 mb-8">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: 'var(--fag-teologi)',
              }}
            >
              <BookMarked className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Teologi · Bibelvers
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            Bibelvers
          </h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Memorer kjernevers fra Bibelen (1930-oversettelsen, falt i det fri). Vers du husker,
            kommer sjeldnere tilbake; vers du glemmer, kommer i morgen.
          </p>
        </header>

        {/* practice session */}
        {session && current && (
          <section>
            <div className="mb-4 flex items-center justify-between text-sm text-[var(--color-muted)]">
              <span>{collectionLabel(session.collectionId)}</span>
              <span>
                {session.index + 1} av {session.queue.length}
              </span>
            </div>
            <VerseCard verse={current} onResult={answer} />
            <button
              type="button"
              onClick={() => setSession(null)}
              className="mt-4 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
            >
              Avbryt økten
            </button>
          </section>
        )}

        {/* session summary */}
        {finished && !session && (
          <section className="animate-fade-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center sm:p-8">
            <span
              aria-hidden
              className="mx-auto grid h-12 w-12 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: 'var(--fag-teologi)',
              }}
            >
              <Check className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-2xl text-[var(--color-ivory)]">Økten er ferdig</h2>
            <p className="mt-2 text-[var(--color-muted)]">
              Du husket {finished.remembered} av {finished.queue.length} vers i «
              {collectionLabel(finished.collectionId)}». Godt jobbet — repetisjonen er planlagt.
            </p>
            <button
              type="button"
              onClick={() => setFinished(null)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
            >
              <RotateCcw className="h-4 w-4" />
              Til samlingene
            </button>
          </section>
        )}

        {/* collection overview */}
        {!session && !finished && (
          <section className="grid gap-4 sm:grid-cols-2">
            {verseCollections.map((c) => {
              const due = sr ? (dueByCollection[c.id] ?? 0) : null
              return (
                <div
                  key={c.id}
                  className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-xl text-[var(--color-ivory)]">{c.label}</h2>
                    {due !== null && (
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={
                          due > 0
                            ? {
                                backgroundColor:
                                  'color-mix(in srgb, var(--fag) 16%, transparent)',
                                color: 'var(--fag-teologi)',
                              }
                            : { color: 'var(--color-muted)' }
                        }
                      >
                        {due > 0 ? `${due} å øve` : 'Alt repetert'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 flex-1 text-sm text-[var(--color-muted)]">{c.description}</p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">{c.verseIds.length} vers</p>
                  <div className="mt-4">
                    {due !== null && due > 0 ? (
                      <button
                        type="button"
                        onClick={() => start(c.id)}
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--fag) 16%, transparent)',
                          color: 'var(--fag-teologi)',
                        }}
                      >
                        Øv nå
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => start(c.id, true)}
                        disabled={sr === null}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)] disabled:opacity-50"
                      >
                        Øv likevel
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </main>
    </AppShell>
  )
}
