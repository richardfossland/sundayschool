'use client'

import { useMemo } from 'react'
import type { SongNote } from '@/types/song'
import type { Feedback } from '@/lib/useWaitMode'
import { keyboardLayout, padToC } from '@/lib/keyboard-geometry'
import { pitchClass, noteName } from '@/lib/music'
import { useBeatValue } from '@/lib/useBeatDriven'
import { cn } from '@/lib/cn'

// The on-screen keyboard. Geometry comes from the shared `keyboardLayout` helper
// (same source the falling-notes canvas uses), so the two always line up. Fixed
// range C2–C7 for full songs. Keys light in their hand's colour while sounding,
// show wait-mode targets/feedback, and can carry a chord-tone overlay.
//
// The play-head is read HERE, not passed down: omit `currentBeat` and the
// keyboard subscribes to the transport itself (useBeatValue), re-rendering only
// when the set of sounding keys actually changes. The orchestrator above it
// therefore never re-renders per beat — see lib/useBeatDriven.

const HIT = '#6BD08A'
const EPS = 1e-6

type ActiveMap = Map<number, 'L' | 'R'>

/** Which keys sound at `beat`, and in which hand's colour. */
function activeAt(notes: SongNote[], beat: number): ActiveMap {
  const m: ActiveMap = new Map()
  if (beat < 0) return m
  for (const n of notes) {
    if (n.t - EPS <= beat && beat < n.t + n.d - EPS) {
      if (n.h === 'R' || !m.has(n.p)) m.set(n.p, n.h)
    }
  }
  return m
}

const EMPTY_ACTIVE: ActiveMap = new Map()

function sameActive(a: ActiveMap, b: ActiveMap): boolean {
  if (a.size !== b.size) return false
  for (const [p, h] of a) if (b.get(p) !== h) return false
  return true
}

const WHITE_H = 160
const BLACK_H = 96

interface Props {
  /** Transposed notes (both hands, or hand-filtered by the caller). */
  notes: SongNote[]
  /** Time source. OMIT it to follow the live transport (the keyboard subscribes
   * itself, so the parent does not re-render per beat). Pass a number to drive
   * the picture from somewhere else, or a negative value to suppress sounding
   * highlights entirely (wait-/chord-mode paint via `expected`/`feedback`). */
  currentBeat?: number
  /** Wait-mode: pitches the player should hit right now (outlined). */
  expected?: Set<number>
  /** Wait-mode: transient hit/miss feedback per pressed key. */
  feedback?: Map<number, Feedback>
  /** Chord-tone overlay: dot keys whose pitch class is in the current chord. */
  overlay?: { root: number; tones: Set<number> }
  /** Make keys playable — click/tap feeds a note-on. */
  onKeyPress?: (midi: number) => void
  lowMidi?: number
  highMidi?: number
  whiteKeyWidth?: number
  /** Wrap in a self-scrolling bordered panel (default). Pass false to render the
   * bare keyboard so a parent can share one horizontal scroll container with the
   * falling-notes canvas. */
  scroll?: boolean
}

export function Keyboard({
  notes,
  currentBeat,
  expected,
  feedback,
  overlay,
  onKeyPress,
  lowMidi = 36, // C2
  highMidi = 96, // C7
  whiteKeyWidth = 34,
  scroll = true,
}: Props) {
  const layout = useMemo(() => {
    const [lo, hi] = padToC(lowMidi, highMidi)
    return keyboardLayout(lo, hi, whiteKeyWidth)
  }, [lowMidi, highMidi, whiteKeyWidth])

  // Live path: subscribe to the transport ourselves and re-render only when the
  // sounding set changes. Driven path (`currentBeat` given): plain derivation.
  const driven = currentBeat !== undefined
  const liveActive = useBeatValue(
    (beat) => (driven ? EMPTY_ACTIVE : activeAt(notes, beat)),
    [notes, driven],
    { isEqual: sameActive },
  )
  const drivenActive = useMemo(
    () => (currentBeat === undefined ? EMPTY_ACTIVE : activeAt(notes, currentBeat)),
    [notes, currentBeat],
  )
  const active = driven ? drivenActive : liveActive

  const overlayDot = (m: number, black: boolean) => {
    if (!overlay || !overlay.tones.has(pitchClass(m))) return null
    const isRoot = pitchClass(m) === pitchClass(overlay.root)
    return (
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: black ? 4 : 20,
          width: isRoot ? 8 : 6,
          height: isRoot ? 8 : 6,
          background: isRoot ? 'var(--color-amber)' : 'var(--color-sea)',
          opacity: 0.85,
        }}
      />
    )
  }

  // Resolve fill/glow for a key: feedback > active(sounding) > default.
  const fillFor = (m: number, black: boolean): { bg?: string; glow?: string } => {
    const fb = feedback?.get(m)
    if (fb) return { bg: fb === 'hit' ? HIT : 'var(--color-danger)', glow: fb === 'hit' ? HIT : 'var(--color-danger)' }
    const hand = active.get(m)
    if (hand) {
      const c = hand === 'R' ? 'var(--color-amber)' : 'var(--color-sea)'
      return { bg: c, glow: c }
    }
    return black ? { bg: 'var(--color-black-key)' } : {}
  }

  const isTarget = (m: number) => expected?.has(m) ?? false

  const whites = layout.keys.filter((k) => !k.isBlack)
  const blacks = layout.keys.filter((k) => k.isBlack)

  const inner = (
    <div className="relative select-none" style={{ width: layout.totalWidth, height: WHITE_H }}>
      {whites.map((k) => {
        const { bg, glow } = fillFor(k.midi, false)
        return (
          <div
            key={k.midi}
            data-midi={k.midi}
            onPointerDown={onKeyPress ? () => onKeyPress(k.midi) : undefined}
            className={cn(
              'absolute top-0 rounded-b-md border border-[#0000002e] transition-colors duration-75',
              bg ? 'shadow-[0_0_18px_2px_var(--tw-shadow-color)]' : 'bg-[var(--color-ivory)]',
              onKeyPress && 'cursor-pointer',
              isTarget(k.midi) && 'ring-2 ring-inset ring-[var(--color-amber)]',
            )}
            style={{
              left: k.x,
              width: k.w - 1,
              height: WHITE_H,
              backgroundColor: bg,
              // @ts-expect-error CSS var for the tailwind shadow-color token
              '--tw-shadow-color': glow,
            }}
          >
            {pitchClass(k.midi) === 0 && (
              <span className="pointer-events-none absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium text-[#8a7c66]">
                {noteName(k.midi)}
              </span>
            )}
            {overlayDot(k.midi, false)}
          </div>
        )
      })}
      {blacks.map((k) => {
        const { bg, glow } = fillFor(k.midi, true)
        const lit = bg && bg !== 'var(--color-black-key)'
        return (
          <div
            key={k.midi}
            data-midi={k.midi}
            onPointerDown={onKeyPress ? () => onKeyPress(k.midi) : undefined}
            className={cn(
              'absolute top-0 z-10 rounded-b-md transition-colors duration-75',
              lit ? 'shadow-[0_0_16px_2px_var(--tw-shadow-color)]' : '',
              onKeyPress && 'cursor-pointer',
              isTarget(k.midi) && 'ring-2 ring-inset ring-[var(--color-amber)]',
            )}
            style={{
              left: k.x,
              width: k.w,
              height: BLACK_H,
              backgroundColor: bg,
              // @ts-expect-error CSS var for the tailwind shadow-color token
              '--tw-shadow-color': glow ?? 'transparent',
            }}
          >
            {overlayDot(k.midi, true)}
          </div>
        )
      })}
    </div>
  )

  if (!scroll) return inner
  return (
    <div className="scroll-x rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
      {inner}
    </div>
  )
}
