// ── Falling-chords renderer (pure, no React) ─────────────────────────────────
//
// Besifringsmodus' counterpart to falling-renderer.ts. Instead of one thin bar
// per note over its key, it draws ONE wide block per chord in a single centred
// lane (chords aren't tied to a key position), each labelled with its symbol,
// falling toward the same hit-line. The active block (the one being waited on)
// freezes at the hit-line and pulses green when the grip is matched.
//
// Reuses the exact `noteScreenY` beat→pixel mapping from falling-renderer, so the
// two views scroll identically; the geometry that carries the correctness
// (band centring + block top/bottom) is pure and unit-tested.

import type { SongChord } from '@/types/song'
import { chordSymbol } from './spelling'
import { noteScreenY } from './falling-renderer'

export interface ChordFallTheme {
  blockColor: string // upcoming chord blocks
  activeColor: string // the block currently at the hit line
  hitColor: string // green pulse when matched
  textColor: string // chord symbol text
  hitLineY: number // y (px) of the strike line
  bgColor?: string
  hitLineColor?: string
  radius?: number
}

export interface ChordFallFrame {
  chords: SongChord[]
  keySignature: string
  currentBeat: number
  lookaheadBeats: number
  widthPx: number
  heightPx: number
  dpr: number
  theme: ChordFallTheme
  /** Index of the chord being waited on (frozen at the hit line). */
  activeIndex?: number | null
  /** 0..1 green-pulse strength on the active block (1 = full flash on a hit). */
  pulse?: number
}

/** Fraction of the view width the chord lane spans (centred). */
export const CHORD_BAND_FRACTION = 0.7

/** Centred lane [x, w] for chord blocks in a view `widthPx` wide. */
export function chordBand(widthPx: number, fraction = CHORD_BAND_FRACTION): { x: number; w: number } {
  const w = widthPx * fraction
  return { x: (widthPx - w) / 2, w }
}

/**
 * Top/bottom pixel edges of a chord block spanning [t, t + d], using the shared
 * note beat→y mapping (onset reaches the hit line first, tail sits higher up).
 */
export function chordBlockY(
  t: number,
  d: number,
  currentBeat: number,
  lookahead: number,
  height: number,
): { top: number; bottom: number } {
  const bottom = noteScreenY(t, currentBeat, lookahead, height)
  const top = noteScreenY(t + d, currentBeat, lookahead, height)
  return { top, bottom }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

/** Draw one frame of the falling-chords view. Never throws on out-of-range data. */
export function drawFallingChords(ctx: CanvasRenderingContext2D, frame: ChordFallFrame): void {
  const { chords, currentBeat, lookaheadBeats, widthPx, heightPx, dpr, theme } = frame
  const hitY = theme.hitLineY
  const radius = theme.radius ?? 10
  const look = lookaheadBeats > 0 ? lookaheadBeats : 4
  const band = chordBand(widthPx)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, widthPx, heightPx)
  if (theme.bgColor) {
    ctx.fillStyle = theme.bgColor
    ctx.fillRect(0, 0, widthPx, heightPx)
  }

  chords.forEach((c, i) => {
    const { top, bottom } = chordBlockY(c.t, c.d, currentBeat, look, hitY)
    if (bottom < -4) return // fully above the view
    if (top > hitY + 4) return // fully below the hit line

    const isActive = frame.activeIndex != null && frame.activeIndex === i
    const drawTop = Math.max(-2, top)
    const drawBottom = Math.min(hitY, bottom)
    const h = Math.max(6, drawBottom - drawTop)

    ctx.save()
    ctx.globalAlpha = isActive ? 1 : 0.85
    roundRect(ctx, band.x, drawTop, band.w, h, radius)
    ctx.fillStyle = isActive ? theme.activeColor : theme.blockColor
    ctx.fill()

    // Green pulse over the active block when the grip matches.
    const pulse = isActive ? Math.max(0, Math.min(1, frame.pulse ?? 0)) : 0
    if (pulse > 0) {
      ctx.globalAlpha = 0.55 * pulse
      roundRect(ctx, band.x, drawTop, band.w, h, radius)
      ctx.fillStyle = theme.hitColor
      ctx.fill()
    }
    ctx.restore()

    // Chord symbol, centred in the block (clipped to the drawn band height).
    ctx.save()
    ctx.globalAlpha = 1
    ctx.fillStyle = theme.textColor
    ctx.font = `600 ${Math.min(22, Math.max(13, h * 0.5))}px "Playfair Display", Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const label = chordSymbol(c.r, c.q, frame.keySignature, c.b)
    ctx.fillText(label, band.x + band.w / 2, drawTop + h / 2, band.w - 12)
    ctx.restore()
  })

  // Hit line last.
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.strokeStyle = theme.hitLineColor ?? theme.activeColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, hitY)
  ctx.lineTo(widthPx, hitY)
  ctx.stroke()
  ctx.restore()
}
