'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Square, Loader2 } from 'lucide-react'
import type { Song } from '@/types/song'
import { fetchSong } from '@/lib/songs'
import { getEngine } from '@/lib/engine'
import { nearestOffset, transposeDoc } from '@/lib/transpose'
import { recordPractice } from '@/lib/progress'

// ── IntroTrening ──────────────────────────────────────────────────────────────
// Øv innledningen til ett innslag: sangen transponeres til måltonearten og den
// FØRSTE seksjonen (intro/frase) loopes via den delte engine-en. Bevisst liten —
// play/stop + tempo. Én global engine betyr at bare én intro spiller om gangen;
// å starte en ny bygger den om og stopper den forrige.

export function IntroTrening({ workSlug, targetKey }: { workSlug: string; targetKey: number }) {
  const [song, setSong] = useState<Song | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bpm, setBpm] = useState(80)
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm

  useEffect(() => {
    let alive = true
    fetchSong(workSlug).then((s) => {
      if (alive) {
        setSong(s)
        if (s) setBpm(s.default_bpm)
      }
    })
    return () => {
      alive = false
    }
  }, [workSlug])

  // Stopp engine-en når komponenten forlates midt i avspilling.
  useEffect(
    () => () => {
      if (playing) getEngine().stop()
    },
    [playing],
  )

  const firstSection = song?.doc.sections[0] ?? null

  const toggle = async () => {
    const engine = getEngine()
    if (playing) {
      engine.stop()
      setPlaying(false)
      return
    }
    if (!song || !firstSection) return
    setLoading(true)
    const offset = nearestOffset(song.original_key, targetKey)
    const doc = transposeDoc(song.doc, offset)
    // Loop kun [0, første seksjons slutt] — innledningen, om og om igjen.
    engine.build(doc, { hand: 'both', bpm: bpmRef.current, loop: true, transpose: 0 })
    engine.setLoopRange(0, firstSection.endBeat)
    await engine.play()
    setLoading(false)
    setPlaying(true)
    recordPractice(`lovsang:intro-${workSlug}`, bpmRef.current)
  }

  const onBpm = (v: number) => {
    setBpm(v)
    if (playing) getEngine().setTempo(v)
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] p-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!song || !firstSection || loading}
          aria-label={playing ? 'Stopp intro' : 'Spill intro'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-scene)] transition-transform active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: 'var(--fag)' }}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : playing ? (
            <Square className="h-5 w-5" fill="currentColor" />
          ) : (
            <Play className="h-5 w-5" fill="currentColor" />
          )}
        </button>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Intro-øving
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-ivory)]">
            {firstSection ? firstSection.label : 'Ingen seksjon'} loopes
          </p>
        </div>

        <div className="flex min-w-[180px] flex-1 items-center gap-3">
          <span className="w-12 shrink-0 text-sm text-[var(--color-muted)]">Tempo</span>
          <input
            type="range"
            min={40}
            max={160}
            step={1}
            value={bpm}
            onChange={(e) => onBpm(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer"
            style={{ accentColor: 'var(--fag)' }}
            aria-label="Tempo (BPM)"
          />
          <span className="w-16 shrink-0 text-right font-display text-base tabular-nums text-[var(--color-ivory)]">
            {bpm}
            <span className="ml-1 text-xs text-[var(--color-muted)]">BPM</span>
          </span>
        </div>
      </div>
    </div>
  )
}
