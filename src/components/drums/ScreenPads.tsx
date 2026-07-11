'use client'

import { useEffect, useRef, useState } from 'react'
import { LANES } from '@/lib/drums/drum-lanes'
import type { HitResult } from '@/lib/drums/types'
import { LANE_COLORS } from './lane-colors'

// ── ScreenPads — the on-screen drum kit ───────────────────────────────────────
// Nine tappable pads in LANE ORDER (kick left … ride right) so they sit exactly
// under the falling lanes above them. Each pad also has a home-row keyboard
// shortcut (A–L). The parent triggers the sound + judges the strike and returns
// the verdict, which flashes the pad green (perfect), amber (early/late) or red
// (miss) — or the lane colour in free play.

const PAD_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']

interface Props {
  /** Strike lane `i`: play the sample + judge. Return the verdict for flashing
   * (null = free play, flash neutral). */
  onPad: (laneIndex: number) => HitResult | null
}

type Flash = { kind: HitResult | 'free'; seq: number }

function flashColor(kind: Flash['kind'], laneIndex: number): string {
  switch (kind) {
    case 'perfect':
      return 'var(--color-sea)'
    case 'early':
    case 'late':
      return 'var(--color-amber)'
    case 'miss':
      return 'var(--color-danger)'
    default:
      return LANE_COLORS[laneIndex]
  }
}

export function ScreenPads({ onPad }: Props) {
  const [flash, setFlash] = useState<Record<number, Flash>>({})
  const seqRef = useRef(0)
  const onPadRef = useRef(onPad)
  onPadRef.current = onPad

  const strike = (lane: number) => {
    const verdict = onPadRef.current(lane)
    const seq = ++seqRef.current
    setFlash((f) => ({ ...f, [lane]: { kind: verdict ?? 'free', seq } }))
    window.setTimeout(() => {
      setFlash((f) => (f[lane]?.seq === seq ? { ...f, [lane]: undefined as unknown as Flash } : f))
    }, 180)
  }
  const strikeRef = useRef(strike)
  strikeRef.current = strike

  // Home-row shortcuts (A–L), one per lane. Ignore repeats and typing contexts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      const lane = PAD_KEYS.indexOf(e.key.toLowerCase())
      if (lane === -1 || lane >= LANES.length) return
      e.preventDefault()
      strikeRef.current(lane)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex gap-1.5" role="group" aria-label="Skjermtrommer">
      {LANES.map((lane, i) => {
        const f = flash[i]
        const active = f !== undefined && f !== null
        const color = active ? flashColor(f.kind, i) : LANE_COLORS[i]
        return (
          <button
            key={lane.id}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              strike(i)
            }}
            aria-label={`${lane.label} (tast ${PAD_KEYS[i].toUpperCase()})`}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-3 transition-transform active:scale-95 sm:py-4"
            style={{
              borderColor: active ? color : 'var(--color-border)',
              backgroundColor: active
                ? `color-mix(in srgb, ${color} 26%, transparent)`
                : 'var(--color-raised)',
            }}
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="w-full truncate text-center text-[11px] leading-tight text-[var(--color-ivory)]">
              {lane.label}
            </span>
            <span className="hidden text-[10px] uppercase text-[var(--color-muted)] sm:block">
              {PAD_KEYS[i]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
