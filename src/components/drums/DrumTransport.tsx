'use client'

import { Play, Square, Repeat, Loader2, Timer, Hash } from 'lucide-react'
import { cn } from '@/lib/cn'

// ── DrumTransport — local transport wrapper for the Trommer fag ───────────────
// TransportBar's key grid and hand selector are meaningless for drums, but the
// shared TransportBar must not change (W-contract). This wrapper re-renders just
// the relevant controls (play/stop, loop, tempo, metronome, count-in) with the
// exact same styling language so the two fag feel identical.

interface Props {
  isPlaying: boolean
  isLoading: boolean
  onPlayToggle: () => void
  bpm: number
  onBpm: (bpm: number) => void
  loop: boolean
  /** Omit to lock the loop state (a groove always loops) — renders the chip
   * as a passive indicator instead of a button. */
  onLoopToggle?: () => void
  metronome: boolean
  onMetronomeToggle: () => void
  countIn: boolean
  onCountInToggle: () => void
}

export function DrumTransport(p: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {/* Row 1: play + loop + tempo */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={p.onPlayToggle}
          disabled={p.isLoading}
          aria-label={p.isPlaying ? 'Stopp' : 'Spill'}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-amber)] text-[var(--color-ink-on-amber)] transition-transform active:scale-95 disabled:opacity-60"
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
          disabled={!p.onLoopToggle}
          aria-pressed={p.loop}
          title={p.onLoopToggle ? 'Loop sangen eller den valgte delen' : 'Grooven looper alltid'}
          className={cn(
            'flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
            p.loop
              ? 'border-[var(--color-sea)] bg-[var(--color-sea)]/15 text-[var(--color-sea)]'
              : 'border-[var(--color-border)] text-[var(--color-muted)]',
            !p.onLoopToggle && 'cursor-default',
          )}
        >
          <Repeat className="h-4 w-4" /> Loop
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
            className="h-11 flex-1 cursor-pointer accent-[var(--color-amber)]"
            style={{ touchAction: 'pan-y' }}
            aria-label="Tempo (BPM)"
          />
          <span className="w-20 shrink-0 text-right font-display text-lg tabular-nums">
            {p.bpm}
            <span className="ml-1 text-xs text-[var(--color-muted)]">BPM</span>
          </span>
        </div>
      </div>

      {/* Row 2: rhythm feel (metronome / count-in) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0 text-sm text-[var(--color-muted)]">Rytme</span>
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
      </div>
    </div>
  )
}
