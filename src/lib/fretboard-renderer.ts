// ── Falling-fretboard renderer (pure, no React) ──────────────────────────────
//
// The bass/guitar sibling of falling-renderer.ts. DESIGN CHOICE (kept testable
// and consistent with the rest of the app): each STRING is a VERTICAL LANE —
// the low string (index 0, e.g. bass low E) is the LEFTMOST lane — and notes
// fall DOWN toward a horizontal hit line, exactly like the piano falling view.
// We deliberately do NOT rotate to a guitar-hero sideways scroll: every other
// view in SundaySchool falls downward onto the instrument, and the interactive
// fretboard panel sits under the hit line the same way the keyboard does.
// Which FRET to press is shown as a number on the note bar itself (and echoed
// on the fretboard panel below by the component).
//
// Time→y reuses `noteScreenY` from falling-renderer.ts, so the two views share
// the exact same fall physics; lane→x lives here in `laneRect` and both are
// unit-tested in a plain Node env (drawing is the only canvas-touching part).

import { noteScreenY } from './falling-renderer'

/** One generated note to render: when + where (already resolved to a position). */
export interface FretLaneNote {
  beat: number // onset, in beats
  durBeats: number // duration, in beats
  string: number // string index (0 = lowest = leftmost lane)
  fret: number // 0 = open — shown as the number on the bar
}

/** Horizontal extent of a string's lane: equal-width vertical slots, lane 0
 * (the LOW string) leftmost, with a small inner padding for the note bars. */
export function laneRect(
  stringIdx: number,
  laneCount: number,
  widthPx: number,
): { x: number; w: number } {
  const n = Math.max(1, laneCount)
  const slot = widthPx / n
  const i = Math.min(Math.max(0, stringIdx), n - 1)
  const pad = Math.min(6, slot * 0.1)
  return { x: i * slot + pad, w: Math.max(2, slot - pad * 2) }
}

export interface FretFallingTheme {
  /** Note-bar colour (the bass fag accent). */
  color: string
  /** Y (px) of the strike line — a note whose onset == currentBeat sits here. */
  hitLineY: number
  bgColor?: string
  hitLineColor?: string
  /** Colour of the vertical lane guides. */
  laneColor?: string
  /** Fret-number text colour (drawn on the bar). */
  textColor?: string
  loopShade?: string
  radius?: number
}

export interface FretFallingFrame {
  notes: FretLaneNote[]
  currentBeat: number
  lookaheadBeats: number
  laneCount: number
  /** Open-string labels for the lane footer, low→high (e.g. E A D G). */
  stringLabels?: string[]
  widthPx: number
  heightPx: number
  dpr: number
  theme: FretFallingTheme
  /** A-B loop as [startBeat, endBeat] — time outside it is shaded. */
  loop?: [number, number] | null
  /** Wait-mode target beat — notes at this onset get a highlight ring. */
  waitBeat?: number | null
}

const EPS = 1e-6

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

/** Draw one frame of the falling-fretboard view. Never throws on odd data. */
export function drawFallingFretboard(ctx: CanvasRenderingContext2D, frame: FretFallingFrame): void {
  const { currentBeat, lookaheadBeats, laneCount, widthPx, heightPx, dpr, theme } = frame
  const hitY = theme.hitLineY
  const radius = theme.radius ?? 5
  const look = lookaheadBeats > 0 ? lookaheadBeats : 4
  const yOf = (beat: number) => noteScreenY(beat, currentBeat, look, hitY)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, widthPx, heightPx)
  if (theme.bgColor) {
    ctx.fillStyle = theme.bgColor
    ctx.fillRect(0, 0, widthPx, heightPx)
  }

  // Lane guides — a thin vertical line down the centre of each string's lane
  // (reads as the string itself), plus the open-string label at the bottom.
  ctx.save()
  ctx.strokeStyle = theme.laneColor ?? 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  for (let s = 0; s < laneCount; s++) {
    const { x, w } = laneRect(s, laneCount, widthPx)
    const cx = x + w / 2
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, hitY)
    ctx.stroke()
    const label = frame.stringLabels?.[s]
    if (label) {
      ctx.fillStyle = theme.laneColor ?? 'rgba(255,255,255,0.35)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(label, cx, Math.min(hitY + 6, heightPx - 12))
    }
  }
  ctx.restore()

  // Shade time outside the A-B loop (same convention as the piano view).
  if (frame.loop) {
    const [a, b] = frame.loop
    ctx.fillStyle = theme.loopShade ?? 'rgba(0,0,0,0.38)'
    const yb = yOf(b)
    if (yb > 0) ctx.fillRect(0, 0, widthPx, Math.min(yb, hitY))
    const ya = yOf(a)
    if (ya < hitY) ctx.fillRect(0, Math.max(0, ya), widthPx, hitY - Math.max(0, ya))
  }

  // Note bars, fret number on each.
  for (const n of frame.notes) {
    const { x, w } = laneRect(n.string, laneCount, widthPx)
    const yBottom = yOf(n.beat)
    const yTop = yOf(n.beat + n.durBeats)
    if (yBottom < -4) continue // above the view
    if (yTop > hitY + 4) continue // already played

    const sounding = n.beat - EPS <= currentBeat && currentBeat < n.beat + n.durBeats - EPS
    const isTarget = frame.waitBeat != null && Math.abs(n.beat - frame.waitBeat) < 1e-3

    const drawTop = Math.max(-2, yTop)
    const drawBottom = Math.min(hitY, yBottom)
    const h = Math.max(3, drawBottom - drawTop)

    ctx.save()
    if (sounding) {
      ctx.shadowColor = theme.color
      ctx.shadowBlur = 18
      ctx.globalAlpha = 1
    } else {
      ctx.globalAlpha = 0.9
    }
    roundRect(ctx, x, drawTop, w, h, radius)
    ctx.fillStyle = theme.color
    ctx.fill()

    // Fret number near the leading (bottom) edge of the bar — "press here next".
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
    ctx.fillStyle = theme.textColor ?? '#171210'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    const textY = Math.min(drawBottom - 4, hitY - 4)
    if (textY > drawTop + 12) ctx.fillText(String(n.fret), x + w / 2, textY)

    if (isTarget) {
      ctx.lineWidth = 2
      ctx.strokeStyle = theme.hitLineColor ?? theme.color
      roundRect(ctx, x, drawTop, w, h, radius)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Hit line (drawn last so it reads above the note tails).
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.strokeStyle = theme.hitLineColor ?? theme.color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, hitY)
  ctx.lineTo(widthPx, hitY)
  ctx.stroke()
  ctx.restore()
}
