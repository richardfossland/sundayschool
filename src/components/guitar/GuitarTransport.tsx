'use client'

import { Play, Square, Repeat, Loader2, Timer, Hash } from 'lucide-react'
import { KEY_NAMES } from '@/lib/music'
import { cn } from '@/lib/cn'

// ── GuitarTransport ───────────────────────────────────────────────────────────
// Local variant of the shared TransportBar (which is piano-specific with its
// hand filter and wait-mode). Same visual language: play/stop, loop, tempo,
// metronome, count-in and the 12-key toneart grid. `targetKey` IS the sounding
// key — the capo is a separate, grip-only dimension handled by CapoHelper.

interface Props {
  isPlaying: boolean
  isLoading: boolean
  onPlayToggle: () => void
  bpm: number
  onBpm: (bpm: number) => void
  targetKey: number
  onKey: (k: number) => void
  metronome: boolean
  onMetronomeToggle: () => void
  countIn: boolean
  onCountInToggle: () => void
  loop: boolean
  onLoopToggle: () => void
}

export function GuitarTransport(p: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {/* Row 1: play + loop + tempo */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={p.onPlayToggle}
          disabled={p.isLoading}
          aria-label={p.isPlaying ? 'Stopp' : 'Spill'}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--fag-gitar)] text-[var(--color-ink-on-amber)] transition-transform active:scale-95 disabled:opacity-60"
        >
          {p.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : p.isPlaying ? (
            <Square className="h-6 w-6" fill="currentColor" />
          ) : (
            <Play className="h-6 w-6" fill="currentColor" />
          )}
        </button>

        <button
          onClick={p.onLoopToggle}
          aria-pressed={p.loop}
          title="Loop hele sangen eller den valgte delen"
          className={cn(
            'flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
            p.loop
              ? 'border-[var(--color-sea)] bg-[var(--color-sea)]/15 text-[var(--color-sea)]'
              : 'border-[var(--color-border)] text-[var(--color-muted)]',
          )}
        >
          <Repeat className="h-4 w-4" /> Loop
        </button>

        <button
          onClick={p.onMetronomeToggle}
          aria-pressed={p.metronome}
          title="Metronom-klikk på hvert slag"
          className={cn(
            'flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
            p.metronome
              ? 'border-[var(--color-sea)] bg-[var(--color-sea)]/15 text-[var(--color-sea)]'
              : 'border-[var(--color-border)] text-[var(--color-muted)]',
          )}
        >
          <Timer className="h-4 w-4" /> Metronom
        </button>

        <button
          onClick={p.onCountInToggle}
          aria-pressed={p.countIn}
          title="Tell inn én takt før avspilling"
          className={cn(
            'flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
            p.countIn
              ? 'border-[var(--color-sea)] bg-[var(--color-sea)]/15 text-[var(--color-sea)]'
              : 'border-[var(--color-border)] text-[var(--color-muted)]',
          )}
        >
          <Hash className="h-4 w-4" /> Tell inn
        </button>

        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          <span className="w-16 shrink-0 text-sm text-[var(--color-muted)]">Tempo</span>
          <input
            type="range"
            min={40}
            max={180}
            step={1}
            value={p.bpm}
            onChange={(e) => p.onBpm(Number(e.target.value))}
            className="h-11 flex-1 cursor-pointer accent-[var(--fag-gitar)]"
            style={{ touchAction: 'pan-y' }}
            aria-label="Tempo (BPM)"
          />
          <span className="w-20 shrink-0 text-right font-display text-lg tabular-nums">
            {p.bpm}
            <span className="ml-1 text-xs text-[var(--color-muted)]">BPM</span>
          </span>
        </div>
      </div>

      {/* Row 2: key grid — the SOUNDING key */}
      <div className="flex items-start gap-2">
        <span className="mt-1.5 w-16 shrink-0 text-sm text-[var(--color-muted)]">Toneart</span>
        <div className="grid flex-1 grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-12">
          {KEY_NAMES.map((name, k) => (
            <button
              key={k}
              onClick={() => p.onKey(k)}
              aria-pressed={p.targetKey === k}
              className={cn(
                'min-h-11 min-w-11 rounded-lg border px-1 text-sm font-medium tabular-nums transition-colors',
                p.targetKey === k
                  ? 'border-[var(--fag-gitar)] bg-[var(--fag-gitar)] text-[var(--color-ink-on-amber)]'
                  : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-ivory)] hover:border-[var(--fag-gitar)]/50',
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
