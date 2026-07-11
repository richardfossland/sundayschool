// ── Falling-drums renderer (pure, no React) ──────────────────────────────────
//
// The drum sibling of lib/falling-renderer.ts. Instead of a piano keyboard the
// x-axis is the LANES (kick left … ride right); hits are capsules falling down
// their lane toward a hit line just above the on-screen pads. Time → y reuses
// the exact same `noteScreenY` mapping, and everything derives from
// `currentBeat` (the ONE time source), so audio and visuals cannot drift.
//
// Judged hits (from the timing trainer) are re-coloured: green for perfect,
// amber for early/late, red for miss. DOM-free except the drawing context, so
// the geometry is unit-tested in plain Node.

import { noteScreenY } from '../falling-renderer'
import { LANES, laneOf } from './drum-lanes'
import type { DrumHit, HitResult } from './types'

export interface LaneRect {
  x: number // left edge, px
  w: number // width, px
}

/** Evenly tile `widthPx` into one column per lane, left → right. Pure. */
export function laneGeometry(widthPx: number, laneCount: number = LANES.length): LaneRect[] {
  const w = widthPx / laneCount
  return Array.from({ length: laneCount }, (_, i) => ({ x: i * w, w }))
}

/** Center-x (px) of the lane a GM pitch falls in, or null when unmapped. */
export function hitCenterX(pitch: number, widthPx: number): number | null {
  const lane = laneOf(pitch)
  if (lane === null) return null
  const w = widthPx / LANES.length
  return lane * w + w / 2
}

export interface DrumsTheme {
  /** Fill per lane index (kick … ride). Missing entries fall back to noteColor. */
  laneColors?: string[]
  noteColor: string
  hitLineY: number
  hitLineColor?: string
  bgColor?: string
  laneLineColor?: string // vertical lane separators
  perfectColor: string
  goodColor: string // early / late
  missColor: string
}

export interface DrumsFrame {
  hits: DrumHit[]
  /** Per-hit verdicts (parallel to `hits`) for the current pass; null = unjudged. */
  results?: (HitResult | null)[] | null
  currentBeat: number
  lookaheadBeats: number
  widthPx: number
  heightPx: number
  dpr: number
  theme: DrumsTheme
  /** A-B loop as [startBeat, endBeat] — time outside it is shaded. */
  loop?: [number, number] | null
}

function capsule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const r = Math.min(w / 2, h / 2)
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draw one frame of the falling-drums view. Never throws on out-of-range data. */
export function drawFallingDrums(ctx: CanvasRenderingContext2D, frame: DrumsFrame): void {
  const { hits, currentBeat, lookaheadBeats, widthPx, heightPx, dpr, theme } = frame
  const hitY = theme.hitLineY
  const look = lookaheadBeats > 0 ? lookaheadBeats : 4
  const lanes = laneGeometry(widthPx)
  const yOf = (beat: number) => noteScreenY(beat, currentBeat, look, hitY)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, widthPx, heightPx)
  if (theme.bgColor) {
    ctx.fillStyle = theme.bgColor
    ctx.fillRect(0, 0, widthPx, heightPx)
  }

  // Lane separators.
  if (theme.laneLineColor) {
    ctx.save()
    ctx.strokeStyle = theme.laneLineColor
    ctx.lineWidth = 1
    for (let i = 1; i < lanes.length; i++) {
      ctx.beginPath()
      ctx.moveTo(lanes[i].x, 0)
      ctx.lineTo(lanes[i].x, heightPx)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Shade time outside the A-B loop (mirrors falling-renderer).
  if (frame.loop) {
    const [a, b] = frame.loop
    ctx.fillStyle = 'rgba(0,0,0,0.42)'
    const yb = yOf(b)
    if (yb > 0) ctx.fillRect(0, 0, widthPx, Math.min(yb, hitY))
    const ya = yOf(a)
    if (ya < hitY) ctx.fillRect(0, Math.max(0, ya), widthPx, hitY - Math.max(0, ya))
  }

  // Hits — capsules centred in their lane, one fixed visual height (a drum hit
  // has no meaningful duration).
  const results = frame.results ?? null
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i]
    const lane = laneOf(h.p)
    if (lane === null) continue

    const y = yOf(h.t)
    const capH = 14
    // Cull outside the view (a judged hit lingers briefly below the line).
    if (y < -capH) continue
    if (y > hitY + capH * 2) continue

    const rect = lanes[lane]
    const pad = Math.max(3, rect.w * 0.22)
    const x = rect.x + pad
    const w = Math.max(4, rect.w - pad * 2)

    const verdict = results?.[i] ?? null
    const laneColor = theme.laneColors?.[lane] ?? theme.noteColor
    const color =
      verdict === 'perfect'
        ? theme.perfectColor
        : verdict === 'early' || verdict === 'late'
          ? theme.goodColor
          : verdict === 'miss'
            ? theme.missColor
            : laneColor

    const striking = Math.abs(y - hitY) < capH
    ctx.save()
    if (striking || verdict === 'perfect') {
      ctx.shadowColor = color
      ctx.shadowBlur = 14
      ctx.globalAlpha = 1
    } else {
      ctx.globalAlpha = (h.v ?? 0.8) >= 0.6 ? 0.92 : 0.55 // ghost notes read fainter
    }
    capsule(ctx, x, y - capH / 2, w, capH)
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
  }

  // Hit line, drawn last.
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.strokeStyle = theme.hitLineColor ?? theme.noteColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, hitY)
  ctx.lineTo(widthPx, hitY)
  ctx.stroke()
  ctx.restore()
}
