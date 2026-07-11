'use client'

import type { Shape } from '@/lib/guitar/chord-shapes'

// ── ChordDiagram — SVG grip diagram ──────────────────────────────────────────
// The classic vertical chord box: 6 strings × 4–5 frets, finger dots, o/x
// markers over the nut and a "3fr"-style base-fret label for barre grips.
// Styled for the dark scene with the gitar accent; the label (already spelled
// via chordSymbol by the caller) sits above the box.

interface Props {
  shape: Shape
  /** Chord symbol, key-correct (chordSymbol from lib/spelling). */
  label: string
  /** Pixel width of the rendered SVG (height follows). */
  width?: number
  muted?: boolean
}

const STRINGS = 6

export function ChordDiagram({ shape, label, width = 110, muted = false }: Props) {
  // Window: at least 4 fret rows, growing if the grip spans more.
  const fretted = shape.frets.filter((f): f is number => f !== 'x' && f !== 0)
  const maxFret = fretted.length > 0 ? Math.max(...fretted) : shape.baseFret
  const rows = Math.max(4, maxFret - shape.baseFret + 1)

  // Geometry (viewBox units).
  const W = 100
  const left = 14
  const right = 90
  const gridTop = 26
  const rowH = 17
  const gridBottom = gridTop + rows * rowH
  const H = gridBottom + 8
  const colW = (right - left) / (STRINGS - 1)
  const x = (stringIdx: number) => left + stringIdx * colW // 0 = low E (leftmost)

  const accent = 'var(--fag-gitar)'
  const line = 'var(--color-border)'
  const text = muted ? 'var(--color-muted)' : 'var(--color-ivory)'

  return (
    <div className="flex flex-col items-center" style={{ width }}>
      <span
        className="mb-1 font-display text-base leading-none"
        style={{ color: muted ? 'var(--color-muted)' : accent }}
      >
        {label}
      </span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={width}
        height={(width * H) / W}
        role="img"
        aria-label={`Grep for ${label}`}
        style={{ opacity: muted ? 0.55 : 1 }}
      >
        {/* Nut (thick) in open position, otherwise a normal top line + base-fret label */}
        {shape.baseFret === 1 ? (
          <rect x={left - 1} y={gridTop - 3.5} width={right - left + 2} height={3.5} rx={1} fill={text} />
        ) : (
          <>
            <line x1={left} y1={gridTop} x2={right} y2={gridTop} stroke={line} strokeWidth={1.4} />
            <text
              x={left - 4}
              y={gridTop + rowH * 0.65}
              textAnchor="end"
              fontSize="8.5"
              fill="var(--color-muted)"
            >
              {shape.baseFret}fr
            </text>
          </>
        )}

        {/* Frets */}
        {Array.from({ length: rows }, (_, i) => (
          <line
            key={`f${i}`}
            x1={left}
            y1={gridTop + (i + 1) * rowH}
            x2={right}
            y2={gridTop + (i + 1) * rowH}
            stroke={line}
            strokeWidth={1.2}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line
            key={`s${i}`}
            x1={x(i)}
            y1={gridTop}
            x2={x(i)}
            y2={gridBottom}
            stroke={line}
            strokeWidth={i === 0 ? 1.6 : 1.1}
          />
        ))}

        {/* Per-string markers: x / o above the nut, dots on the frets */}
        {shape.frets.map((f, i) => {
          const cx = x(i)
          if (f === 'x') {
            return (
              <text
                key={i}
                x={cx}
                y={gridTop - 6}
                textAnchor="middle"
                fontSize="9"
                fill="var(--color-muted)"
              >
                ×
              </text>
            )
          }
          if (f === 0) {
            return (
              <circle
                key={i}
                cx={cx}
                cy={gridTop - 9}
                r={3.2}
                fill="none"
                stroke={text}
                strokeWidth={1.3}
              />
            )
          }
          const row = f - shape.baseFret // 0-based row of this fret in the window
          const cy = gridTop + row * rowH + rowH / 2
          const finger = shape.fingers?.[i]
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={5.6} fill={accent} />
              {finger ? (
                <text
                  x={cx}
                  y={cy + 2.6}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight={700}
                  fill="var(--color-ink-on-amber, #1c1613)"
                >
                  {finger}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
