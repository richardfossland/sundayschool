'use client'

import { useState } from 'react'
import {
  accidentalLabel,
  angleForIndex,
  circleEntries,
  neighbors,
  pointOnCircle,
} from '@/lib/theory/circle'
import { cn } from '@/lib/cn'

// ── CircleOfFifths ────────────────────────────────────────────────────────────
// Clickable SVG kvintsirkel: outer ring = major keys, inner ring = relative
// minors. Selecting a key shows its accidentals, relative minor and closest
// neighbors. All circle coordinates come from theory/circle.pointOnCircle,
// which ROUNDS to 3 decimals — unrounded sin/cos floats stringify differently
// on the server vs. in the browser and cause a React hydration mismatch (the
// known SundayLicks circle-of-fifths gotcha).

const SIZE = 300
const CENTER = SIZE / 2
const OUTER_R = 112
const INNER_R = 70
const OUTER_BTN = 22
const INNER_BTN = 15

const ENTRIES = circleEntries()

export function CircleOfFifths() {
  const [selectedPc, setSelectedPc] = useState(0) // C

  const selected = ENTRIES.find((e) => e.pc === selectedPc)!
  const nb = neighbors(selectedPc)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="group"
          aria-label="Kvintsirkelen"
          className="w-full max-w-[320px] shrink-0"
        >
          {/* Ring guides */}
          <circle cx={CENTER} cy={CENTER} r={OUTER_R} fill="none" stroke="var(--color-border)" />
          <circle cx={CENTER} cy={CENTER} r={INNER_R} fill="none" stroke="var(--color-border)" />

          {ENTRIES.map((e) => {
            const angle = angleForIndex(e.index)
            const op = pointOnCircle(CENTER, CENTER, OUTER_R, angle)
            const ip = pointOnCircle(CENTER, CENTER, INNER_R, angle)
            const active = e.pc === selectedPc
            const isNeighbor = e.pc === nb.dominant || e.pc === nb.subdominant
            return (
              <g
                key={e.pc}
                onClick={() => setSelectedPc(e.pc)}
                className="cursor-pointer"
                role="button"
                aria-pressed={active}
                aria-label={`${e.major}-dur (${e.minor}-moll)`}
              >
                {/* Major (outer) */}
                <circle
                  cx={op.x}
                  cy={op.y}
                  r={OUTER_BTN}
                  fill={active ? 'var(--fag-teori)' : 'var(--color-raised)'}
                  stroke={active || isNeighbor ? 'var(--fag-teori)' : 'var(--color-border)'}
                  strokeWidth={isNeighbor && !active ? 2 : 1}
                />
                <text
                  x={op.x}
                  y={op.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="13"
                  fontWeight="600"
                  fill={active ? 'var(--color-scene)' : 'var(--color-ivory)'}
                  className="pointer-events-none select-none"
                >
                  {e.major}
                </text>
                {/* Relative minor (inner) */}
                <circle
                  cx={ip.x}
                  cy={ip.y}
                  r={INNER_BTN}
                  fill={active ? 'color-mix(in srgb, var(--fag-teori) 30%, var(--color-raised))' : 'var(--color-scene)'}
                  stroke="var(--color-border)"
                />
                <text
                  x={ip.x}
                  y={ip.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fill="var(--color-muted)"
                  className="pointer-events-none select-none"
                >
                  {e.minor}
                </text>
              </g>
            )
          })}

          {/* Center label */}
          <text
            x={CENTER}
            y={CENTER - 8}
            textAnchor="middle"
            fontSize="18"
            fontWeight="600"
            fill="var(--color-ivory)"
            className="pointer-events-none select-none font-display"
          >
            {selected.major}-dur
          </text>
          <text
            x={CENTER}
            y={CENTER + 12}
            textAnchor="middle"
            fontSize="12"
            fill="var(--color-muted)"
            className="pointer-events-none select-none"
          >
            {accidentalLabel(selected.accidentals)}
          </text>
        </svg>

        {/* Facts about the selected key */}
        <dl className="w-full space-y-2.5 text-sm sm:pt-4">
          {(
            [
              ['Toneart', `${selected.major}-dur`],
              ['Fortegn', accidentalLabel(selected.accidentals)],
              ['Relativ moll', `${selected.minor}-moll (samme fortegn)`],
              ['Dominant (V)', `${ENTRIES.find((e) => e.pc === nb.dominant)!.major}-dur — ett steg med klokka`],
              ['Subdominant (IV)', `${ENTRIES.find((e) => e.pc === nb.subdominant)!.major}-dur — ett steg mot klokka`],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border)] pb-2">
              <dt className="shrink-0 text-[var(--color-muted)]">{label}</dt>
              <dd className={cn('text-right font-medium text-[var(--color-ivory)]')}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
