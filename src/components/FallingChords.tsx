'use client'

import { useEffect, useRef } from 'react'
import type { SongChord } from '@/types/song'
import { drawFallingChords, type ChordFallTheme } from '@/lib/falling-chords-renderer'
import { usePlayer } from '@/lib/store'

// The falling-chords canvas — besifringsmodus' answer to FallingNotes. A rAF loop
// reads the frozen chord beat (chord mode stops the transport) and paints the
// pure `drawFallingChords`. Same width as the keyboard so the shared scroll
// container stays aligned.

interface Props {
  chords: SongChord[]
  keySignature: string
  /** Beat to freeze the view at (the active chord's onset). */
  beatOverride: number | null
  /** Index of the active chord (frozen at the hit line). */
  activeIndex: number | null
  /** True while the current grip matches — drives the green pulse. */
  hit?: boolean
  widthPx: number
  heightPx?: number
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function FallingChords({
  chords,
  keySignature,
  beatOverride,
  activeIndex,
  hit = false,
  widthPx,
  heightPx = 240,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const chordsRef = useRef(chords)
  chordsRef.current = chords
  const keyRef = useRef(keySignature)
  keyRef.current = keySignature
  const overrideRef = useRef(beatOverride)
  overrideRef.current = beatOverride
  const activeRef = useRef(activeIndex)
  activeRef.current = activeIndex
  const hitRef = useRef(hit)
  hitRef.current = hit
  const themeRef = useRef<ChordFallTheme>({
    blockColor: '#3a2f28',
    activeColor: '#EBB84B',
    hitColor: '#6BD08A',
    textColor: '#faf4e6',
    hitLineY: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssWidth = widthPx
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
      blockColor: cssVar('--color-raised', '#3a2f28'),
      activeColor: cssVar('--color-amber', '#EBB84B'),
      hitColor: '#6BD08A',
      textColor: cssVar('--color-ivory', '#faf4e6'),
      bgColor: cssVar('--color-scene', '#171210'),
      hitLineColor: cssVar('--color-amber', '#EBB84B'),
      hitLineY,
      radius: 12,
    }

    const ro = new ResizeObserver(() => {
      dpr = applySize()
    })
    ro.observe(canvas)

    // A soft, decaying pulse each time `hit` flips true.
    let pulse = 0
    let prevHit = false

    let raf = 0
    const loop = () => {
      if (hitRef.current && !prevHit) pulse = 1
      prevHit = hitRef.current
      pulse = Math.max(0, pulse - 0.04)

      const currentBeat = overrideRef.current != null ? overrideRef.current : usePlayer.getState().currentBeat
      drawFallingChords(ctx, {
        chords: chordsRef.current,
        keySignature: keyRef.current,
        currentBeat,
        lookaheadBeats: usePlayer.getState().lookaheadBeats,
        widthPx: cssWidth,
        heightPx: cssHeight,
        dpr,
        theme: themeRef.current,
        activeIndex: activeRef.current,
        pulse,
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [widthPx, heightPx])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="block rounded-xl"
      style={{ width: widthPx, height: heightPx }}
    />
  )
}
