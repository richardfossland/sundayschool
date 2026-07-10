'use client'

import { Play, Square, Repeat, Loader2, Timer, Hash, Piano } from 'lucide-react'
import type { HandFilter } from '@/types/song'
import { KEY_NAMES } from '@/lib/music'
import { cn } from '@/lib/cn'

// Transport + practice controls for a whole song. Play/stop, tempo, target key,
// hand, metronome, count-in, wait-mode and loop. All Norwegian (bokmål). The
// key grid shows the 12 note names; the parent turns the chosen key into a
// nearest-path semitone offset for the engine.

interface Props {
  isPlaying: boolean
  isLoading: boolean
  onPlayToggle: () => void
  bpm: number
  defaultBpm: number
  onBpm: (bpm: number) => void
  targetKey: number
  onKey: (k: number) => void
  hand: HandFilter
  onHand: (h: HandFilter) => void
  metronome: boolean
  onMetronomeToggle: () => void
  countIn: boolean
  onCountInToggle: () => void
  waitMode: boolean
  onWaitToggle: () => void
  loop: boolean
  onLoopToggle: () => void
}

const HANDS: { id: HandFilter; label: string }[] = [
  { id: 'both', label: 'Begge' },
  { id: 'L', label: 'Venstre' },
  { id: 'R', label: 'Høyre' },
]

export function TransportBar(p: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {/* Row 1: play + loop + wait-mode + tempo */}
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
          onClick={p.onWaitToggle}
          aria-pressed={p.waitMode}
          title="Øvemodus — appen venter på at du spiller riktig tangent"
          className={cn(
            'flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
            p.waitMode
              ? 'border-[var(--color-ember)] bg-[var(--color-ember)]/15 text-[var(--color-ember)]'
              : 'border-[var(--color-border)] text-[var(--color-muted)]',
          )}
        >
          <Piano className="h-4 w-4" /> Øvemodus
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
            className="h-2 flex-1 cursor-pointer accent-[var(--color-amber)]"
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

      {/* Row 3: hand select */}
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-sm text-[var(--color-muted)]">Hånd</span>
        <div className="flex gap-2">
          {HANDS.map((h) => (
            <button
              key={h.id}
              onClick={() => p.onHand(h.id)}
              aria-pressed={p.hand === h.id}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                p.hand === h.id
                  ? h.id === 'R'
                    ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15 text-[var(--color-amber)]'
                    : h.id === 'L'
                      ? 'border-[var(--color-sea)] bg-[var(--color-sea)]/15 text-[var(--color-sea)]'
                      : 'border-[var(--color-ivory)] bg-[var(--color-ivory)]/10 text-[var(--color-ivory)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)]',
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 4: key grid */}
      <div className="flex items-start gap-2">
        <span className="mt-1.5 w-16 shrink-0 text-sm text-[var(--color-muted)]">Toneart</span>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
          {KEY_NAMES.map((name, k) => (
            <button
              key={k}
              onClick={() => p.onKey(k)}
              aria-pressed={p.targetKey === k}
              className={cn(
                'rounded-lg border py-1.5 text-sm font-medium tabular-nums transition-colors',
                p.targetKey === k
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber)] text-[var(--color-ink-on-amber)]'
                  : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-ivory)] hover:border-[var(--color-amber)]/50',
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
