'use client'

import { useEffect, useRef, useState } from 'react'
import { LANES } from '@/lib/drums/drum-lanes'
import type { HitResult } from '@/lib/drums/types'
import { cn } from '@/lib/cn'
import { LANE_COLORS } from './lane-colors'
import { SIMPLE_LANES } from '@/lib/drums/simple-pads'

// ── ScreenPads — the on-screen drum kit ───────────────────────────────────────
// A real drum-kit grid instead of nine cramped equal columns: two rows on a
// 12-column grid — cymbals up top (hi-hat · open hi-hat · crash · ride), drums
// below (a wide kick, then snare + the three toms). Every pad is big enough to
// hit on a phone, shows its full lane label, its accent dot and its keyboard
// letter (A–L, one per lane). The parent triggers the sound + judges the strike
// and returns the verdict, which flashes the pad green (perfect), amber
// (early/late) or red (miss) — or the lane colour in free play.
//
// Velocity: a tap reports how hard it landed. A pressure-capable pointer (pen /
// force-touch) uses `e.pressure`; otherwise the vertical position in the pad
// stands in — the top third is a soft "ghost" note, the rest a normal hit —
// clamped to 0.5–1. Keyboard strikes are a flat 0.9. A short haptic tick fires
// on pointer-down where supported.

const PAD_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']

interface Props {
  /** Strike lane `i` at `velocity` (0–1): play the sample + judge. Return the
   * verdict for flashing (null = free play, flash neutral). */
  onPad: (laneIndex: number, velocity: number) => HitResult | null
  /** Simplified 4-pad kit (kick · snare · hi-hat · crash) in a 2×2 grid. */
  simple?: boolean
}

type Flash = { kind: HitResult | 'free'; seq: number }

// Full kit: lane index + its column span on the 12-col grid. Row 1 is the four
// cymbals (3 cols each = 12); row 2 is the drums (a 4-wide kick anchoring the
// left, then snare + three toms at 2 cols each = 12).
interface PadSpec {
  lane: number
  span: string
}
const FULL_LAYOUT: PadSpec[] = [
  { lane: 2, span: 'col-span-3' }, // Hi-hat
  { lane: 3, span: 'col-span-3' }, // Åpen hi-hat
  { lane: 7, span: 'col-span-3' }, // Crash
  { lane: 8, span: 'col-span-3' }, // Ride
  { lane: 0, span: 'col-span-4' }, // Basstromme (extra wide)
  { lane: 1, span: 'col-span-2' }, // Skarptromme
  { lane: 6, span: 'col-span-2' }, // Tom (høy)
  { lane: 5, span: 'col-span-2' }, // Tom (mid)
  { lane: 4, span: 'col-span-2' }, // Gulvtom
]
const SIMPLE_LAYOUT: PadSpec[] = SIMPLE_LANES.map((lane) => ({ lane, span: '' }))

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

/** Velocity for a pointer strike: a real pressure reading when the device gives
 * one, otherwise the vertical position (top third = soft ghost). Clamp 0.5–1.
 *
 * A MOUSE has no pressure sensor but still reports a constant 0.5 while a button
 * is held (per the Pointer Events spec), which is inside the 0–1 window — so
 * trusting it made every single mouse click the weakest possible hit. Pressure
 * is only believed from a pointer type that can actually measure it. */
function velocityFromPointer(e: React.PointerEvent<HTMLButtonElement>): number {
  let v: number
  if (e.pointerType !== 'mouse' && e.pressure > 0 && e.pressure < 1) {
    v = e.pressure
  } else {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5
    v = rel < 1 / 3 ? 0.6 : 0.9
  }
  return Math.max(0.5, Math.min(1, v))
}

export function ScreenPads({ onPad, simple = false }: Props) {
  const [flash, setFlash] = useState<Record<number, Flash>>({})
  const seqRef = useRef(0)
  const onPadRef = useRef(onPad)
  onPadRef.current = onPad

  const strike = (lane: number, velocity: number) => {
    const verdict = onPadRef.current(lane, velocity)
    const seq = ++seqRef.current
    setFlash((f) => ({ ...f, [lane]: { kind: verdict ?? 'free', seq } }))
    window.setTimeout(() => {
      setFlash((f) => (f[lane]?.seq === seq ? { ...f, [lane]: undefined as unknown as Flash } : f))
    }, 180)
  }
  const strikeRef = useRef(strike)
  strikeRef.current = strike

  // Home-row shortcuts (A–L), one per lane. Ignore repeats and typing contexts.
  // Keyboard hits carry a flat 0.9 velocity (no pressure to read).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      const lane = PAD_KEYS.indexOf(e.key.toLowerCase())
      if (lane === -1 || lane >= LANES.length) return
      // In simple mode only the four visible pads respond to their keys.
      if (simple && !SIMPLE_LANES.includes(lane as (typeof SIMPLE_LANES)[number])) return
      e.preventDefault()
      strikeRef.current(lane, 0.9)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [simple])

  const specs = simple ? SIMPLE_LAYOUT : FULL_LAYOUT

  return (
    <div
      className={cn('grid gap-2', simple ? 'grid-cols-2' : 'grid-cols-12')}
      role="group"
      aria-label="Skjermtrommer"
    >
      {specs.map((spec) => {
        const i = spec.lane
        const lane = LANES[i]
        const f = flash[i]
        const active = f !== undefined && f !== null
        const color = active ? flashColor(f.kind, i) : LANE_COLORS[i]
        return (
          <button
            key={lane.id}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              navigator.vibrate?.(8)
              strike(i, velocityFromPointer(e))
            }}
            aria-label={`${lane.label} (tast ${PAD_KEYS[i].toUpperCase()})`}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 transition-transform active:scale-95',
              spec.span,
              simple ? 'min-h-20 sm:min-h-28' : 'min-h-16 sm:min-h-24',
            )}
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
            <span className="w-full text-center text-[11px] leading-tight text-[var(--color-ivory)] sm:text-xs">
              {lane.label}
            </span>
            <span className="text-[9px] uppercase leading-none text-[var(--color-muted)] sm:text-[10px]">
              {PAD_KEYS[i]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
