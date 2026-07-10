'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { SongDoc } from '@/types/song'
import { keyboardLayout, padToC } from '@/lib/keyboard-geometry'
import { drawFalling, type FallingTheme } from '@/lib/falling-renderer'
import { usePlayer } from '@/lib/store'

// The falling-notes canvas. A requestAnimationFrame loop reads `currentBeat`
// straight from the store each frame (no React re-render per frame) and calls the
// pure `drawFalling`. The canvas is exactly as wide as the keyboard's white-key
// span and shares a horizontal scroll container with it, so the two always align.

interface Props {
  /** Transposed song document (both hands rendered, coloured per hand). */
  doc: SongDoc
  /** Wait-mode target beat: when set, the view scrolls to and freezes here and
   * the notes at this onset get a highlight ring. */
  waitBeat?: number | null
  /** Drive the view from this beat instead of the live transport (wait-mode). */
  beatOverride?: number | null
  lowMidi?: number
  highMidi?: number
  whiteKeyWidth?: number
  heightPx?: number
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function FallingNotes({
  doc,
  waitBeat = null,
  beatOverride = null,
  lowMidi = 36, // C2
  highMidi = 96, // C7
  whiteKeyWidth = 34,
  heightPx = 240,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const geometry = useMemo(() => {
    const [lo, hi] = padToC(lowMidi, highMidi)
    return keyboardLayout(lo, hi, whiteKeyWidth)
  }, [lowMidi, highMidi, whiteKeyWidth])

  // Live values the animation loop reads without re-subscribing.
  const docRef = useRef(doc)
  docRef.current = doc
  const waitRef = useRef(waitBeat)
  waitRef.current = waitBeat
  const overrideRef = useRef(beatOverride)
  overrideRef.current = beatOverride
  const geomRef = useRef(geometry)
  geomRef.current = geometry

  // Resolve token colours once (canvas can't read CSS variables directly).
  const themeRef = useRef<FallingTheme>({ rightColor: '#EBB84B', leftColor: '#5FB3A1', hitLineY: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssWidth = geometry.totalWidth
    const cssHeight = heightPx
    const hitLineY = cssHeight - 3

    const applySize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)
      return dpr
    }
    let dpr = applySize()

    themeRef.current = {
      rightColor: cssVar('--color-amber', '#EBB84B'),
      leftColor: cssVar('--color-sea', '#5FB3A1'),
      bgColor: cssVar('--color-scene', '#171210'),
      hitLineColor: cssVar('--color-amber', '#EBB84B'),
      loopShade: 'rgba(0,0,0,0.42)',
      hitLineY,
      radius: 5,
    }

    // Re-apply backing-store size when the device pixel ratio changes (e.g.
    // dragging between displays); the CSS width is fixed by the geometry.
    const ro = new ResizeObserver(() => {
      dpr = applySize()
    })
    ro.observe(canvas)

    let raf = 0
    const loop = () => {
      const st = usePlayer.getState()
      const currentBeat = overrideRef.current != null ? overrideRef.current : st.currentBeat
      drawFalling(ctx, {
        doc: docRef.current,
        currentBeat,
        lookaheadBeats: st.lookaheadBeats,
        geometry: geomRef.current,
        heightPx: cssHeight,
        widthPx: cssWidth,
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
  }, [geometry, heightPx])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="block rounded-xl"
      style={{ width: geometry.totalWidth, height: heightPx }}
    />
  )
}
