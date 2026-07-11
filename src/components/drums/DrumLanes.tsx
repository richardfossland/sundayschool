'use client'

import { useEffect, useRef } from 'react'
import { usePlayer } from '@/lib/store'
import { drawFallingDrums, type DrumsTheme } from '@/lib/drums/falling-drums-renderer'
import type { DrumHit, HitResult } from '@/lib/drums/types'
import { LANE_COLORS } from './lane-colors'

// The falling-drums canvas — the drum sibling of FallingNotes. A rAF loop reads
// `currentBeat` straight from the store each frame (no React re-render per
// frame) and calls the pure drawFallingDrums. Unlike the piano canvas the width
// is RESPONSIVE (lanes stretch, no horizontal scroll), so it fills its container
// and the ScreenPads row below shares the same 9-column split.

interface Props {
  hits: DrumHit[]
  /** Per-hit verdicts for the current pass (parallel to hits) — colours markers. */
  results?: (HitResult | null)[] | null
  heightPx?: number
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function DrumLanes({ hits, results = null, heightPx = 260 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Live values the animation loop reads without re-subscribing.
  const hitsRef = useRef(hits)
  hitsRef.current = hits
  const resultsRef = useRef(results)
  resultsRef.current = results

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const hitLineY = heightPx - 3
    const theme: DrumsTheme = {
      laneColors: LANE_COLORS,
      noteColor: cssVar('--color-amber', '#EBB84B'),
      hitLineY,
      hitLineColor: cssVar('--color-amber', '#EBB84B'),
      bgColor: cssVar('--color-scene', '#171210'),
      laneLineColor: 'rgba(255,255,255,0.06)',
      perfectColor: cssVar('--color-sea', '#5FB3A1'),
      goodColor: cssVar('--color-amber', '#EBB84B'),
      missColor: cssVar('--color-danger', '#E0604C'),
    }

    let cssWidth = wrap.clientWidth
    let dpr = 1
    const applySize = () => {
      cssWidth = wrap.clientWidth
      dpr = Math.max(1, window.devicePixelRatio || 1)
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${heightPx}px`
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(heightPx * dpr)
    }
    applySize()
    const ro = new ResizeObserver(applySize)
    ro.observe(wrap)

    let raf = 0
    const loop = () => {
      const st = usePlayer.getState()
      drawFallingDrums(ctx, {
        hits: hitsRef.current,
        results: resultsRef.current,
        currentBeat: st.currentBeat,
        lookaheadBeats: st.lookaheadBeats,
        widthPx: cssWidth,
        heightPx,
        dpr,
        theme,
        loop: st.loop,
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [heightPx])

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} aria-hidden className="block rounded-xl" style={{ height: heightPx }} />
    </div>
  )
}
