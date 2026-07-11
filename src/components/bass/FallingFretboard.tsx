'use client'

import { useEffect, useRef } from 'react'
import { drawFallingFretboard, type FretLaneNote, type FretFallingTheme } from '@/lib/fretboard-renderer'
import { usePlayer } from '@/lib/store'

// The falling-fretboard canvas — the bass sibling of FallingNotes.tsx, same
// rAF pattern: the loop reads `currentBeat` straight from the store each frame
// (no React re-render per frame) and calls the pure `drawFallingFretboard`.
// One vertical lane per string (low E leftmost), notes fall down onto the hit
// line; each bar carries its fret number. The canvas fills its container width
// (only 4 lanes — no horizontal scroll needed, unlike the 61-key piano).

interface Props {
  /** Generated bassline notes with resolved string/fret positions. */
  notes: FretLaneNote[]
  laneCount: number
  /** Open-string labels for the lane footer, low→high (E A D G). */
  stringLabels?: string[]
  /** Wait-mode target beat: freeze here and ring the notes at this onset. */
  waitBeat?: number | null
  /** Drive the view from this beat instead of the live transport (wait-mode). */
  beatOverride?: number | null
  heightPx?: number
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function FallingFretboard({
  notes,
  laneCount,
  stringLabels,
  waitBeat = null,
  beatOverride = null,
  heightPx = 240,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Live values the animation loop reads without re-subscribing.
  const notesRef = useRef(notes)
  notesRef.current = notes
  const labelsRef = useRef(stringLabels)
  labelsRef.current = stringLabels
  const waitRef = useRef(waitBeat)
  waitRef.current = waitBeat
  const overrideRef = useRef(beatOverride)
  overrideRef.current = beatOverride

  const themeRef = useRef<FretFallingTheme>({ color: '#A5695F', hitLineY: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssHeight = heightPx
    const hitLineY = cssHeight - 22 // leave room for the string labels below
    let cssWidth = canvas.clientWidth || 480
    let dpr = 1

    const applySize = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1)
      cssWidth = canvas.clientWidth || cssWidth
      canvas.style.height = `${cssHeight}px`
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)
    }
    applySize()

    themeRef.current = {
      color: cssVar('--fag-bass', '#A5695F'),
      hitLineColor: cssVar('--color-amber', '#EBB84B'),
      bgColor: cssVar('--color-scene', '#171210'),
      laneColor: 'rgba(255,255,255,0.14)',
      textColor: cssVar('--color-scene', '#171210'),
      loopShade: 'rgba(0,0,0,0.42)',
      hitLineY,
      radius: 6,
    }

    // Track container width (responsive) and device-pixel-ratio changes.
    const ro = new ResizeObserver(() => applySize())
    ro.observe(canvas)

    let raf = 0
    const loop = () => {
      const st = usePlayer.getState()
      const currentBeat = overrideRef.current != null ? overrideRef.current : st.currentBeat
      drawFallingFretboard(ctx, {
        notes: notesRef.current,
        currentBeat,
        lookaheadBeats: st.lookaheadBeats,
        laneCount,
        stringLabels: labelsRef.current,
        widthPx: cssWidth,
        heightPx: cssHeight,
        dpr,
        theme: themeRef.current,
        loop: st.loop,
        waitBeat: waitRef.current,
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [laneCount, heightPx])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="block w-full rounded-xl"
      style={{ height: heightPx }}
    />
  )
}
