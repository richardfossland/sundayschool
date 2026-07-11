'use client'

import { useMemo } from 'react'
import type { Feedback } from '@/lib/useWaitMode'
import {
  BASS_EADG,
  fretboardLayout,
  type FretPosition,
} from '@/lib/fretboard-geometry'
import { noteName } from '@/lib/music'

// The interactive fretboard panel — the bass sibling of Keyboard.tsx. Strings
// are horizontal (low E at the BOTTOM, per fretboard-geometry), frets 0–12 are
// clickable cells: tapping string+fret plays that pitch through the caller's
// input pipeline (engine bass sampler + wait-mode gating), exactly like
// clicking a piano key. Expected wait-mode positions are outlined; hit/miss
// feedback flashes; the currently sounding playback positions glow.

const FRETS = 12
const GUTTER = 40 // open-string strip left of the nut (click = open note)
const BOARD_W = 720
const H = 168
const MARKER_FRETS = [3, 5, 7, 9] // single dots; 12 gets a double dot

const COLORS = {
  hit: '#6BD08A',
  miss: 'var(--color-danger, #E5735F)',
  active: 'var(--fag-bass, #A5695F)',
  expected: 'var(--color-amber, #EBB84B)',
}

interface Props {
  /** Play/route a note (engine bass sample + wait-mode input). */
  onPress: (midi: number) => void
  /** Wait-mode: positions the player should press now (outlined rings). */
  expected?: FretPosition[]
  /** Wait-mode: transient hit/miss feedback, keyed by MIDI pitch. */
  feedback?: Map<number, Feedback>
  /** Positions currently sounding during playback (filled dots). */
  active?: FretPosition[]
  tuning?: number[]
}

export function Fretboard({ onPress, expected, feedback, active, tuning = BASS_EADG }: Props) {
  const layout = useMemo(() => fretboardLayout(tuning, FRETS, BOARD_W, H), [tuning])

  const posKey = (p: FretPosition) => `${p.string}:${p.fret}`
  const expectedSet = useMemo(() => new Set((expected ?? []).map(posKey)), [expected])
  const activeSet = useMemo(() => new Set((active ?? []).map(posKey)), [active])

  // A cell's dot centre, in the gutter-shifted coordinate space.
  const dotAt = (s: number, f: number) => {
    const { x, y } = layout.posOf(s, f)
    return { cx: f === 0 ? GUTTER / 2 : GUTTER + x, cy: y }
  }

  const cells: { s: number; f: number; midi: number }[] = []
  for (let s = 0; s < tuning.length; s++) {
    for (let f = 0; f <= FRETS; f++) cells.push({ s, f, midi: tuning[s] + f })
  }

  return (
    <svg
      viewBox={`0 0 ${GUTTER + BOARD_W} ${H}`}
      className="block w-full select-none rounded-xl bg-[var(--color-raised)]"
      role="group"
      aria-label="Gripebrett — klikk på streng og bånd for å spille"
    >
      {/* Nut + fret lines */}
      <line
        x1={GUTTER}
        y1={layout.stringY[tuning.length - 1] - 10}
        x2={GUTTER}
        y2={layout.stringY[0] + 10}
        stroke="var(--color-ivory, #F3EBDD)"
        strokeWidth={4}
      />
      {layout.fretX.slice(1).map((x, i) => (
        <line
          key={i}
          x1={GUTTER + x}
          y1={layout.stringY[tuning.length - 1] - 8}
          x2={GUTTER + x}
          y2={layout.stringY[0] + 8}
          stroke="var(--color-border, #3A322C)"
          strokeWidth={2}
        />
      ))}

      {/* Position markers (dots at 3-5-7-9, double at 12) + fret numbers */}
      {MARKER_FRETS.map((f) => {
        const x = GUTTER + (layout.fretX[f - 1] + layout.fretX[f]) / 2
        return <circle key={f} cx={x} cy={H / 2} r={4} fill="var(--color-border, #3A322C)" />
      })}
      {(() => {
        const x = GUTTER + (layout.fretX[11] + layout.fretX[12]) / 2
        return (
          <g>
            <circle cx={x} cy={H / 2 - 22} r={4} fill="var(--color-border, #3A322C)" />
            <circle cx={x} cy={H / 2 + 22} r={4} fill="var(--color-border, #3A322C)" />
          </g>
        )
      })()}
      {layout.fretX.slice(1).map((x, i) => (
        <text
          key={i}
          x={GUTTER + (layout.fretX[i] + x) / 2}
          y={12}
          textAnchor="middle"
          fontSize={9}
          fill="var(--color-muted, #A99C8A)"
        >
          {i + 1}
        </text>
      ))}

      {/* Strings — thicker toward the low E, with open-string labels */}
      {tuning.map((open, s) => (
        <g key={s}>
          <line
            x1={GUTTER}
            y1={layout.stringY[s]}
            x2={GUTTER + BOARD_W}
            y2={layout.stringY[s]}
            stroke="var(--color-muted, #A99C8A)"
            strokeWidth={3 - s * 0.5}
          />
          <text
            x={GUTTER / 2}
            y={layout.stringY[s] - 8}
            textAnchor="middle"
            fontSize={10}
            fill="var(--color-muted, #A99C8A)"
          >
            {noteName(open).replace(/\d+$/, '')}
          </text>
        </g>
      ))}

      {/* State dots (under the click layer): active playback, expected, feedback */}
      {cells.map(({ s, f, midi }) => {
        const key = `${s}:${f}`
        const fb = feedback?.get(midi)
        const isExpected = expectedSet.has(key)
        const isActive = activeSet.has(key)
        if (!fb && !isExpected && !isActive) return null
        const { cx, cy } = dotAt(s, f)
        const fill = fb === 'hit' ? COLORS.hit : fb === 'miss' ? COLORS.miss : isActive ? COLORS.active : 'transparent'
        return (
          <g key={key} pointerEvents="none">
            {(fb || isActive) && <circle cx={cx} cy={cy} r={11} fill={fill} opacity={0.95} />}
            {isExpected && (
              <circle cx={cx} cy={cy} r={13} fill="none" stroke={COLORS.expected} strokeWidth={2.5} />
            )}
            {(fb || isActive || isExpected) && (
              <text
                x={cx}
                y={cy + 3.5}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={fb || isActive ? 'var(--color-ink-on-amber, #171210)' : COLORS.expected}
              >
                {f}
              </text>
            )}
          </g>
        )
      })}

      {/* Click layer — one transparent cell per string × fret (0 = the gutter) */}
      {cells.map(({ s, f, midi }) => {
        const x0 = f === 0 ? 0 : GUTTER + layout.fretX[f - 1]
        const x1 = f === 0 ? GUTTER : GUTTER + layout.fretX[f]
        const rowH = tuning.length > 1 ? Math.abs(layout.stringY[0] - layout.stringY[1]) : H
        return (
          <rect
            key={`hit-${s}:${f}`}
            x={x0}
            y={layout.stringY[s] - rowH / 2}
            width={x1 - x0}
            height={rowH}
            fill="transparent"
            className="cursor-pointer"
            role="button"
            aria-label={`${noteName(midi)} — streng ${s + 1}, bånd ${f}`}
            onPointerDown={() => onPress(midi)}
          />
        )
      })}
    </svg>
  )
}
