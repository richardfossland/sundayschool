'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Renderer,
  Stave,
  StaveNote,
  StaveConnector,
  StaveTie,
  Voice,
  Formatter,
  Accidental,
  Dot,
  Tuplet,
} from 'vexflow'
import type { SongDoc } from '@/types/song'
import { usePlayer } from '@/lib/store'
import { planScore, type Bar, type ScorePlan, type Token } from '@/lib/notation'

// Full-song grand-staff renderer. A whole hymn is far too heavy to keep in one
// VexFlow context, so we lay the bars out into fixed-height *systems* (rows of
// 2–4 bars, chosen by width) and only draw the systems near the viewport and the
// playback cursor (a ±2-system window) — the rest are cheap placeholders. The
// playback marker and click-to-seek work off a lightweight layout map that each
// drawn system reports back, so scrubbing never re-runs VexFlow. Colours are
// re-painted ivory for the dark scene, the same traversal SundayLicks uses.

const IVORY = '#F3EAD9'
const TREBLE_Y = 34
const BASS_Y = 112
const SYSTEM_HEIGHT = 196
const MARKER_TOP = TREBLE_Y
const MARKER_HEIGHT = 120

function barsPerSystem(width: number): number {
  if (width < 560) return 2
  if (width < 820) return 3
  return 4
}

interface BarBox {
  globalIdx: number
  startBeat: number
  endBeat: number
  beats: number
  x0: number // note-area left (px, within the system SVG)
  x1: number // note-area right
  systemIdx: number
}

interface Props {
  doc: SongDoc
  onSeek?: (beat: number) => void
  /** Auto-scroll the playback marker into view while playing. */
  follow?: boolean
}

export function NotationSong({ doc, onSeek, follow = false }: Props) {
  const plan = useMemo(() => planScore(doc), [doc])
  const scrollRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)

  // Global layout: bar boxes keyed by global bar index (filled by each system).
  const layoutRef = useRef<Map<number, BarBox>>(new Map())
  const followRef = useRef(follow)
  followRef.current = follow

  // Group bars into systems for the current width.
  const systems = useMemo(() => {
    const per = barsPerSystem(width || 800)
    const out: { startIndex: number; bars: Bar[] }[] = []
    for (let i = 0; i < plan.bars.length; i += per) {
      out.push({ startIndex: i, bars: plan.bars.slice(i, i + per) })
    }
    return out
  }, [plan, width])

  // Track container width (drives bars-per-system + system width).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth(Math.max(0, Math.floor(w)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Playback marker (imperative, driven by the store — no React re-render) ──
  const positionMarker = useCallback((beat: number) => {
    const marker = markerRef.current
    if (!marker) return
    // Find the bar box holding this beat (only drawn systems have boxes).
    let box: BarBox | undefined
    for (const b of layoutRef.current.values()) {
      if (beat >= b.startBeat - 1e-6 && beat < b.endBeat - 1e-6) {
        box = b
        break
      }
    }
    if (!box || box.x1 <= box.x0) {
      marker.style.opacity = '0'
      return
    }
    const frac = box.beats > 0 ? (beat - box.startBeat) / box.beats : 0
    const x = box.x0 + frac * (box.x1 - box.x0)
    const top = box.systemIdx * SYSTEM_HEIGHT + MARKER_TOP
    marker.style.transform = `translate(${x}px, ${top}px)`
    marker.style.opacity = '1'
  }, [])

  useEffect(() => {
    let raf = 0
    const apply = (beat: number) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        positionMarker(beat)
        if (followRef.current && usePlayer.getState().isPlaying) scrollBeatIntoView(beat)
      })
    }
    apply(usePlayer.getState().currentBeat)
    const unsub = usePlayer.subscribe((s) => apply(s.currentBeat))
    return () => {
      unsub()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionMarker, systems])

  // Keep the marker correct after a scroll/relayout changes which systems exist.
  useEffect(() => {
    positionMarker(usePlayer.getState().currentBeat)
  }, [scrollTop, width, positionMarker])

  const scrollBeatIntoView = useCallback((beat: number) => {
    const el = scrollRef.current
    if (!el) return
    const per = barsPerSystem(width || 800)
    const barIdx = plan.bars.findIndex((b) => beat >= b.startBeat - 1e-6 && beat < b.endBeat - 1e-6)
    if (barIdx < 0) return
    const sysIdx = Math.floor(barIdx / per)
    const top = sysIdx * SYSTEM_HEIGHT
    const viewTop = el.scrollTop
    const viewBottom = viewTop + el.clientHeight
    if (top < viewTop + 20 || top + SYSTEM_HEIGHT > viewBottom - 20) {
      el.scrollTo({ top: Math.max(0, top - el.clientHeight / 2), behavior: 'smooth' })
    }
  }, [plan, width])

  // Which systems to actually draw: the visible band ±2, plus the marker's system.
  const clientH = scrollRef.current?.clientHeight ?? 600
  const first = Math.max(0, Math.floor(scrollTop / SYSTEM_HEIGHT) - 2)
  const last = Math.min(systems.length - 1, Math.ceil((scrollTop + clientH) / SYSTEM_HEIGHT) + 2)

  const handleLayout = useCallback((systemIdx: number, boxes: BarBox[]) => {
    const map = layoutRef.current
    for (const b of boxes) map.set(b.globalIdx, b)
    // Drop stale boxes for systems no longer drawn happens lazily; positionMarker
    // only trusts boxes whose systemIdx matches, so leftovers are harmless.
    positionMarker(usePlayer.getState().currentBeat)
    void systemIdx
  }, [positionMarker])

  const totalHeight = systems.length * SYSTEM_HEIGHT

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
      className="scroll-y relative max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {systems.map((sys, i) => {
          const visible = i >= first && i <= last
          return (
            <div
              key={sys.startIndex}
              style={{ position: 'absolute', top: i * SYSTEM_HEIGHT, left: 0, right: 0, height: SYSTEM_HEIGHT }}
            >
              {visible && width > 0 ? (
                <SystemView
                  plan={plan}
                  startIndex={sys.startIndex}
                  count={sys.bars.length}
                  systemIdx={i}
                  width={width}
                  showTimeSig={i === 0}
                  onSeek={onSeek}
                  onLayout={handleLayout}
                />
              ) : null}
            </div>
          )
        })}
        {/* Playback cursor — moved imperatively, never re-rendered. */}
        <div
          ref={markerRef}
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 2,
            height: MARKER_HEIGHT,
            background: 'var(--color-amber)',
            opacity: 0,
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  )
}

// ── One system (row of bars) drawn into its own SVG context ──────────────────

interface SystemProps {
  plan: ScorePlan
  startIndex: number
  count: number
  systemIdx: number
  width: number
  showTimeSig: boolean
  onSeek?: (beat: number) => void
  onLayout: (systemIdx: number, boxes: BarBox[]) => void
}

function SystemView({ plan, startIndex, count, systemIdx, width, showTimeSig, onSeek, onLayout }: SystemProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const boxesRef = useRef<BarBox[]>([])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.innerHTML = ''
    const bars = plan.bars.slice(startIndex, startIndex + count)
    if (bars.length === 0) return

    const boxes: BarBox[] = []
    try {
      const renderer = new Renderer(host, Renderer.Backends.SVG)
      renderer.resize(width, SYSTEM_HEIGHT)
      const ctx = renderer.getContext()

      const LEFT = 8
      const RIGHT = 12
      const usable = Math.max(120, width - LEFT - RIGHT)
      // First bar of every system carries the clef + key signature (+ time sig on
      // the very first system), so it needs extra width up front.
      const prefix = 26 + keySigWidth(plan.keySpec) + (showTimeSig ? 22 : 0)
      const totalBeats = bars.reduce((a, b) => a + b.beats, 0) || 1
      const content = Math.max(bars.length * 44, usable - prefix)

      // Keep StaveNote refs for tie drawing, keyed "globalIdx:hand:tokenIdx".
      const noteRefs = new Map<string, StaveNote>()
      let firstTreble: Stave | null = null
      let firstBass: Stave | null = null
      let x = LEFT

      bars.forEach((bar, i) => {
        const isFirst = i === 0
        const globalIdx = startIndex + i
        const w = (isFirst ? prefix : 0) + (content * bar.beats) / totalBeats

        const treble = new Stave(x, TREBLE_Y, w)
        const bass = new Stave(x, BASS_Y, w)
        if (isFirst) {
          treble.addClef('treble').addKeySignature(plan.keySpec)
          bass.addClef('bass').addKeySignature(plan.keySpec)
          if (showTimeSig) {
            treble.addTimeSignature(plan.timeSignature)
            bass.addTimeSignature(plan.timeSignature)
          }
          firstTreble = treble
          firstBass = bass
        }
        treble.setContext(ctx).draw()
        bass.setContext(ctx).draw()

        const rv = buildVoice(bar.R, 'treble', bar.beats, plan.keySpec)
        const lv = buildVoice(bar.L, 'bass', bar.beats, plan.keySpec)
        bar.R.forEach((_, ti) => noteRefs.set(`${globalIdx}:R:${ti}`, rv.staveNotes[ti]))
        bar.L.forEach((_, ti) => noteRefs.set(`${globalIdx}:L:${ti}`, lv.staveNotes[ti]))

        const startX = treble.getNoteStartX()
        const endX = x + w
        const fmtWidth = Math.max(40, endX - startX - 12)
        new Formatter()
          .joinVoices([rv.voice])
          .joinVoices([lv.voice])
          .format([rv.voice, lv.voice], fmtWidth)
        rv.voice.draw(ctx, treble)
        lv.voice.draw(ctx, bass)
        rv.tuplets.forEach((t) => t.setContext(ctx).draw())
        lv.tuplets.forEach((t) => t.setContext(ctx).draw())

        boxes.push({
          globalIdx,
          startBeat: bar.startBeat,
          endBeat: bar.endBeat,
          beats: bar.beats,
          x0: startX,
          x1: endX,
          systemIdx,
        })
        x += w
      })

      // Grand-staff brace + left barline at the system head.
      if (firstTreble && firstBass) {
        new StaveConnector(firstTreble, firstBass).setType('brace').setContext(ctx).draw()
        new StaveConnector(firstTreble, firstBass).setType('singleLeft').setContext(ctx).draw()
      }

      // Ties fully contained in this system (cross-system ties are omitted).
      const endIdx = startIndex + count
      for (const tie of plan.ties) {
        if (tie.fromBar < startIndex || tie.toBar >= endIdx) continue
        const from = noteRefs.get(`${tie.fromBar}:${tie.hand}:${tie.fromToken}`)
        const to = noteRefs.get(`${tie.toBar}:${tie.hand}:${tie.toToken}`)
        if (!from || !to) continue
        new StaveTie({
          first_note: from,
          last_note: to,
          first_indices: [tie.fromKey],
          last_indices: [tie.toKey],
        })
          .setContext(ctx)
          .draw()
      }

      // Bar number over the first bar of the system.
      ctx.save()
      ctx.setFont('Hanken Grotesk, sans-serif', 10)
      ctx.setFillStyle(IVORY)
      ctx.fillText(String(bars[0].number), LEFT + 2, TREBLE_Y - 6)
      ctx.restore()

      recolor(host)
    } catch {
      host.innerHTML = ''
    }

    boxesRef.current = boxes
    onLayout(systemIdx, boxes)
  }, [plan, startIndex, count, systemIdx, width, showTimeSig, onLayout])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    if (py < TREBLE_Y - 8 || py > BASS_Y + 60) return
    let hit: BarBox | undefined
    for (const b of boxesRef.current) {
      if (px >= b.x0 - 20 && px <= b.x1) {
        hit = b
        if (px >= b.x0) break
      }
    }
    if (!hit) return
    const frac = hit.x1 > hit.x0 ? Math.min(1, Math.max(0, (px - hit.x0) / (hit.x1 - hit.x0))) : 0
    onSeek(hit.startBeat + frac * hit.beats)
  }

  return <div ref={hostRef} onClick={handleClick} className={onSeek ? 'cursor-pointer' : undefined} />
}

// ── VexFlow object construction (no DOM until draw) ──────────────────────────

function buildTickable(tok: Token, clef: 'treble' | 'bass'): StaveNote {
  if (tok.kind === 'rest') {
    return new StaveNote({ clef, keys: [clef === 'treble' ? 'b/4' : 'd/3'], duration: `${tok.duration.code}r` })
  }
  const dur = tok.duration.code + 'd'.repeat(tok.duration.dots)
  const note = new StaveNote({ clef, keys: tok.keys, duration: dur })
  if (tok.duration.dots > 0) Dot.buildAndAttach([note], { all: true })
  return note
}

function buildVoice(
  tokens: Token[],
  clef: 'treble' | 'bass',
  beats: number,
  keySpec: string,
): { voice: Voice; staveNotes: StaveNote[]; tuplets: Tuplet[] } {
  const staveNotes = tokens.map((t) => buildTickable(t, clef))

  // Triplet tuplets: consecutive triplet note-tokens, every 3 → one 3:2 bracket.
  const tuplets: Tuplet[] = []
  let run: StaveNote[] = []
  tokens.forEach((tok, i) => {
    if (tok.kind === 'note' && tok.duration.triplet) {
      run.push(staveNotes[i])
      if (run.length === 3) {
        tuplets.push(new Tuplet(run))
        run = []
      }
    } else {
      run = []
    }
  })

  const voice = new Voice({ num_beats: beats, beat_value: 4 }).setStrict(false)
  voice.addTickables(staveNotes)
  // Add exactly the accidentals the key signature + measure context require.
  Accidental.applyAccidentals([voice], keySpec)
  return { voice, staveNotes, tuplets }
}

// Rough px width a key signature occupies (per accidental), for layout budgeting.
function keySigWidth(keySpec: string): number {
  const acc = (keySpec.match(/[#b]/g) ?? []).length
  // Minor specs like 'Gm' end in 'm'; that isn't an accidental. Approximate the
  // signature's accidental count from the spec's leading accidentals only.
  return 10 + acc * 9
}

// Repaint every glyph ivory for the dark scene. VexFlow leaves many glyphs to
// inherit black, so we fill even when the attribute is absent — but never
// override an explicit fill:none (e.g. tuplet/tie brackets, stem gaps).
function recolor(host: HTMLElement) {
  host.querySelectorAll<SVGElement>('svg path, svg text, svg rect, svg g').forEach((el) => {
    const f = el.getAttribute('fill')
    if (f !== 'none') el.setAttribute('fill', IVORY)
    const s = el.getAttribute('stroke')
    if (s && s !== 'none') el.setAttribute('stroke', IVORY)
  })
}
