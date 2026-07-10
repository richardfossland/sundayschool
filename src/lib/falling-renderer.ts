// ── Falling-notes renderer (pure, no React) ──────────────────────────────────
//
// A Synthesia-style "falling notes" view — but warmer and softer. Notes are
// rounded bars in their hand's colour, sitting above their key's x-position and
// falling DOWN toward a hit-line just above the keyboard. Everything is derived
// from `currentBeat` (the ONE time source in the store), so audio and visuals
// can never drift: a note's y is a pure function of (note.t − currentBeat), never
// an accumulated/incremented value. That also means "freezing" is free — when the
// transport stops (wait-mode), currentBeat holds and the picture holds with it.
//
// This module is DOM-free except for the CanvasRenderingContext2D it draws into,
// so the geometry helper `noteScreenY` is unit-tested in a plain Node env.

import type { SongDoc } from '@/types/song'
import type { KeyboardLayout } from './keyboard-geometry'

const EPS = 1e-6

export interface FallingTheme {
  rightColor: string // right hand (amber / suite gold)
  leftColor: string // left hand (sea)
  /** Y (px) where a note whose onset == currentBeat sits — the strike line,
   * placed just above the keyboard. The fall distance is [0, hitLineY]. */
  hitLineY: number
  bgColor?: string // scene background wash (optional)
  hitLineColor?: string // strike-line colour
  loopShade?: string // wash over out-of-loop time
  radius?: number // note corner radius, px
}

export interface FallingFrame {
  doc: SongDoc
  currentBeat: number
  lookaheadBeats: number
  geometry: KeyboardLayout
  heightPx: number
  widthPx: number
  dpr: number
  theme: FallingTheme
  /** A-B loop as [startBeat, endBeat] — time outside it is shaded. */
  loop?: [number, number] | null
  /** Wait-mode target beat — notes at this onset get a highlight ring. When set,
   * the caller should already be feeding this beat AS currentBeat, so the whole
   * picture is frozen; this only adds the "play these" emphasis. */
  waitBeat?: number | null
  /** Extra pitches to render as sounding (e.g. keys actually held), unioned with
   * the notes whose span contains currentBeat. */
  activePitches?: Set<number> | null
}

/**
 * Screen-Y (px) of a note onset at beat `t`, given the current beat, how many
 * beats are previewed (`lookahead`) and the fall distance `height`.
 *
 *   t == currentBeat            → y = height   (the hit line, bottom)
 *   t == currentBeat + lookahead → y = 0       (top of the view, just appearing)
 *   t <  currentBeat            → y > height   (below the hit line — already played)
 *   t >  currentBeat + lookahead → y < 0       (above the view — not yet visible)
 *
 * Strictly decreasing in `t`, so later notes are always higher up. Pure.
 */
export function noteScreenY(t: number, currentBeat: number, lookahead: number, height: number): number {
  const frac = (t - currentBeat) / lookahead // 0 at hit line, 1 at top
  return height * (1 - frac)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2))
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, rad)
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

/** Draw one frame of the falling-notes view. Never throws on out-of-range data. */
export function drawFalling(ctx: CanvasRenderingContext2D, frame: FallingFrame): void {
  const { doc, currentBeat, lookaheadBeats, geometry, heightPx, widthPx, dpr, theme } = frame
  const hitY = theme.hitLineY
  const radius = theme.radius ?? 5
  const look = lookaheadBeats > 0 ? lookaheadBeats : 4

  // Map beat → screen-Y for this frame's constants.
  const yOf = (beat: number) => noteScreenY(beat, currentBeat, look, hitY)

  // Reset to CSS pixels (undo any prior transform) and scale for device pixels.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, widthPx, heightPx)
  if (theme.bgColor) {
    ctx.fillStyle = theme.bgColor
    ctx.fillRect(0, 0, widthPx, heightPx)
  }

  // Key-lookup for x positions.
  const keyX = new Map<number, { x: number; w: number }>()
  for (const k of geometry.keys) keyX.set(k.midi, { x: k.x, w: k.w })

  // Shade time outside the A-B loop (before A and from B onward).
  if (frame.loop) {
    const [a, b] = frame.loop
    ctx.fillStyle = theme.loopShade ?? 'rgba(0,0,0,0.38)'
    // Future side (beats ≥ b) sits above yOf(b); clamp to the top.
    const yb = yOf(b)
    if (yb > 0) ctx.fillRect(0, 0, widthPx, Math.min(yb, hitY))
    // Past side (beats < a) sits below yOf(a); clamp down to the hit line.
    const ya = yOf(a)
    if (ya < hitY) ctx.fillRect(0, Math.max(0, ya), widthPx, hitY - Math.max(0, ya))
  }

  // Notes.
  const activeExtra = frame.activePitches
  for (const n of doc.notes) {
    const rect = keyX.get(n.p)
    if (!rect) continue // pitch outside the drawn keyboard range

    const yBottom = yOf(n.t) // onset — reaches the hit line first
    const yTop = yOf(n.t + n.d) // tail — higher up
    // Cull notes fully above the view or fully below the hit line.
    if (yBottom < -4) continue
    if (yTop > hitY + 4) continue

    const isRight = n.h === 'R'
    const color = isRight ? theme.rightColor : theme.leftColor
    const sounding =
      (n.t - EPS <= currentBeat && currentBeat < n.t + n.d - EPS) || (activeExtra?.has(n.p) ?? false)
    const isTarget = frame.waitBeat != null && Math.abs(n.t - frame.waitBeat) < 1e-3

    const pad = Math.min(3, rect.w * 0.12)
    const x = rect.x + pad
    const w = Math.max(2, rect.w - pad * 2)
    const drawTop = Math.max(-2, yTop)
    const drawBottom = Math.min(hitY, yBottom)
    const h = Math.max(3, drawBottom - drawTop)

    ctx.save()
    if (sounding) {
      // Soft glow on the hit line where the note is striking.
      ctx.shadowColor = color
      ctx.shadowBlur = 18
      ctx.globalAlpha = 1
    } else {
      ctx.globalAlpha = 0.9
    }
    roundRect(ctx, x, drawTop, w, h, radius)
    ctx.fillStyle = color
    ctx.fill()

    if (sounding) {
      // Brighter cap right at the hit line.
      ctx.shadowBlur = 0
      ctx.globalAlpha = 0.35
      ctx.fillStyle = '#FFFFFF'
      roundRect(ctx, x, Math.max(drawTop, hitY - 10), w, Math.min(10, h), radius)
      ctx.fill()
    }
    if (isTarget) {
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
      ctx.lineWidth = 2
      ctx.strokeStyle = theme.rightColor
      roundRect(ctx, x, drawTop, w, h, radius)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Hit line (drawn last so it reads above the note tails).
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.strokeStyle = theme.hitLineColor ?? theme.rightColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, hitY)
  ctx.lineTo(widthPx, hitY)
  ctx.stroke()
  ctx.restore()
}
