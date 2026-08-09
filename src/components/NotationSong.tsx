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
  GhostNote,
  type Note,
} from 'vexflow'
import type { SongDoc, Hand } from '@/types/song'
import { usePlayer } from '@/lib/store'
import { planScore, barLayers, tupletGroups, type Bar, type ScorePlan, type Token } from '@/lib/notation'

// Full-song grand-staff renderer. A whole hymn is far too heavy to keep in one
// VexFlow context, so we lay the bars out into fixed-height *systems* (rows of
// 2–4 bars, chosen by width) and only draw the systems near the viewport and the
// playback cursor (a ±2-system window) — the rest are cheap placeholders. The
// playback marker and click-to-seek work off a lightweight layout map that each
// drawn system reports back, so scrubbing never re-runs VexFlow. Colours are
// re-painted ivory for the dark scene, the same traversal SundayLicks uses.
//
// Two shapes: the default grand staff, and a treble-only staff (`staves`) for
// one-line rhythm/melody snippets, where an empty bass system would be 80 px of
// wasted phone screen. `showMarker` turns the playback cursor off for static
// snippets that never play (the rhythm dictation's answer options).

const IVORY = '#F3EAD9'

interface Layout {
  systemHeight: number
  trebleY: number
  bassY: number | null
  markerHeight: number
  hitTop: number
  hitBottom: number
}

const GRAND: Layout = { systemHeight: 196, trebleY: 34, bassY: 112, markerHeight: 120, hitTop: 26, hitBottom: 172 }
const TREBLE_ONLY: Layout = { systemHeight: 116, trebleY: 30, bassY: null, markerHeight: 54, hitTop: 6, hitBottom: 112 }

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
  /** Draw the playback cursor. Off for snippets that never play. */
  showMarker?: boolean
  /** 'grand' = treble + bass; 'treble' = one staff (single-line material). */
  staves?: 'grand' | 'treble'
}

export function NotationSong({ doc, onSeek, follow = false, showMarker = true, staves = 'grand' }: Props) {
  const plan = useMemo(() => planScore(doc), [doc])
  const layout = staves === 'treble' ? TREBLE_ONLY : GRAND
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
  const positionMarker = useCallback(
    (beat: number) => {
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
      const top = box.systemIdx * layout.systemHeight + layout.trebleY
      marker.style.transform = `translate(${x}px, ${top}px)`
      marker.style.opacity = '1'
    },
    [layout],
  )

  const scrollBeatIntoView = useCallback(
    (beat: number) => {
      const el = scrollRef.current
      if (!el) return
      const per = barsPerSystem(width || 800)
      const barIdx = plan.bars.findIndex((b) => beat >= b.startBeat - 1e-6 && beat < b.endBeat - 1e-6)
      if (barIdx < 0) return
      const sysIdx = Math.floor(barIdx / per)
      const top = sysIdx * layout.systemHeight
      const viewTop = el.scrollTop
      const viewBottom = viewTop + el.clientHeight
      if (top < viewTop + 20 || top + layout.systemHeight > viewBottom - 20) {
        el.scrollTo({ top: Math.max(0, top - el.clientHeight / 2), behavior: 'smooth' })
      }
    },
    [plan, width, layout],
  )

  useEffect(() => {
    if (!showMarker) return
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
  }, [positionMarker, systems, showMarker])

  // Keep the marker correct after a scroll/relayout changes which systems exist.
  useEffect(() => {
    if (showMarker) positionMarker(usePlayer.getState().currentBeat)
  }, [scrollTop, width, positionMarker, showMarker])

  // Which systems to actually draw: the visible band ±2, plus the marker's system.
  const clientH = scrollRef.current?.clientHeight ?? 600
  const first = Math.max(0, Math.floor(scrollTop / layout.systemHeight) - 2)
  const last = Math.min(systems.length - 1, Math.ceil((scrollTop + clientH) / layout.systemHeight) + 2)

  const handleLayout = useCallback(
    (systemIdx: number, boxes: BarBox[]) => {
      const map = layoutRef.current
      for (const b of boxes) map.set(b.globalIdx, b)
      // Drop stale boxes for systems no longer drawn happens lazily; positionMarker
      // only trusts boxes whose systemIdx matches, so leftovers are harmless.
      if (showMarker) positionMarker(usePlayer.getState().currentBeat)
      void systemIdx
    },
    [positionMarker, showMarker],
  )

  const totalHeight = systems.length * layout.systemHeight

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
              style={{
                position: 'absolute',
                top: i * layout.systemHeight,
                left: 0,
                right: 0,
                height: layout.systemHeight,
              }}
            >
              {visible && width > 0 ? (
                <SystemView
                  plan={plan}
                  startIndex={sys.startIndex}
                  count={sys.bars.length}
                  systemIdx={i}
                  width={width}
                  showTimeSig={i === 0}
                  layout={layout}
                  onSeek={onSeek}
                  onLayout={handleLayout}
                />
              ) : null}
            </div>
          )
        })}
        {/* Playback cursor — moved imperatively, never re-rendered. */}
        {showMarker ? (
          <div
            ref={markerRef}
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 2,
              height: layout.markerHeight,
              background: 'var(--color-amber)',
              opacity: 0,
              pointerEvents: 'none',
              willChange: 'transform',
            }}
          />
        ) : null}
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
  layout: Layout
  onSeek?: (beat: number) => void
  onLayout: (systemIdx: number, boxes: BarBox[]) => void
}

function SystemView({ plan, startIndex, count, systemIdx, width, showTimeSig, layout, onSeek, onLayout }: SystemProps) {
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
      renderer.resize(width, layout.systemHeight)
      const ctx = renderer.getContext()

      const LEFT = 8
      const RIGHT = 12
      const usable = Math.max(120, width - LEFT - RIGHT)
      // First bar of every system carries the clef + key signature (+ time sig on
      // the very first system), so it needs extra width up front.
      const prefix = 26 + keySigWidth(plan.keySpec) + (showTimeSig ? 22 : 0)
      const totalBeats = bars.reduce((a, b) => a + b.beats, 0) || 1
      const content = Math.max(bars.length * 44, usable - prefix)

      // Keep StaveNote refs for tie drawing, keyed "globalIdx:hand:layer:tokenIdx".
      const noteRefs = new Map<string, StaveNote>()
      let firstTreble: Stave | null = null
      let firstBass: Stave | null = null
      let x = LEFT

      bars.forEach((bar, i) => {
        const isFirst = i === 0
        const globalIdx = startIndex + i
        const w = (isFirst ? prefix : 0) + (content * bar.beats) / totalBeats

        const treble = new Stave(x, layout.trebleY, w)
        const bass = layout.bassY === null ? null : new Stave(x, layout.bassY, w)
        if (isFirst) {
          treble.addClef('treble').addKeySignature(plan.keySpec)
          bass?.addClef('bass').addKeySignature(plan.keySpec)
          if (showTimeSig) {
            treble.addTimeSignature(plan.timeSignature)
            bass?.addTimeSignature(plan.timeSignature)
          }
          firstTreble = treble
          firstBass = bass
        }
        treble.setContext(ctx).draw()
        bass?.setContext(ctx).draw()

        // Each hand is 1–2 layers; the second layer's rests are invisible
        // spacers so a sustained inner voice never prints a duplicate rest.
        const built = [
          ...buildHand(bar, 'R', 'treble', globalIdx, noteRefs),
          ...(bass ? buildHand(bar, 'L', 'bass', globalIdx, noteRefs) : []),
        ]
        const trebleVoices = built.filter((b) => b.hand === 'R').map((b) => b.voice)
        const bassVoices = built.filter((b) => b.hand === 'L').map((b) => b.voice)
        // Exactly the accidentals the key signature + measure context require —
        // per staff, so the layers of one hand share their accidental state.
        if (trebleVoices.length) Accidental.applyAccidentals(trebleVoices, plan.keySpec)
        if (bassVoices.length) Accidental.applyAccidentals(bassVoices, plan.keySpec)

        const startX = treble.getNoteStartX()
        const endX = x + w
        const fmtWidth = Math.max(40, endX - startX - 12)
        const formatter = new Formatter()
        if (trebleVoices.length) formatter.joinVoices(trebleVoices)
        if (bassVoices.length) formatter.joinVoices(bassVoices)
        formatter.format([...trebleVoices, ...bassVoices], fmtWidth)
        for (const b of built) {
          b.voice.draw(ctx, b.hand === 'R' ? treble : (bass as Stave))
          b.tuplets.forEach((t) => t.setContext(ctx).draw())
        }

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
        if (tie.hand === 'L' && !firstBass) continue
        const from = noteRefs.get(`${tie.fromBar}:${tie.hand}:${tie.fromLayer}:${tie.fromToken}`)
        const to = noteRefs.get(`${tie.toBar}:${tie.hand}:${tie.toLayer}:${tie.toToken}`)
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
      ctx.fillText(String(bars[0].number), LEFT + 2, layout.trebleY - 6)
      ctx.restore()

      recolor(host)
    } catch {
      host.innerHTML = ''
    }

    boxesRef.current = boxes
    onLayout(systemIdx, boxes)
  }, [plan, startIndex, count, systemIdx, width, showTimeSig, layout, onLayout])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    if (py < layout.hitTop || py > layout.hitBottom) return
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

function buildTickable(tok: Token, clef: 'treble' | 'bass', ghostRests: boolean): Note {
  if (tok.kind === 'rest') {
    // A second layer's rests only hold time — drawing them would print a rest
    // under a note that is still sounding in the other layer.
    if (ghostRests) return new GhostNote({ duration: tok.duration.code })
    return new StaveNote({ clef, keys: [clef === 'treble' ? 'b/4' : 'd/3'], duration: `${tok.duration.code}r` })
  }
  const dur = tok.duration.code + 'd'.repeat(tok.duration.dots)
  const note = new StaveNote({ clef, keys: tok.keys, duration: dur })
  if (tok.duration.dots > 0) Dot.buildAndAttach([note], { all: true })
  return note
}

// One 3:2 bracket per complete triplet group (grouping lives in the pure core).
function collectTuplets(tokens: Token[], notes: Note[]): Tuplet[] {
  return tupletGroups(tokens).map(
    (idx) => new Tuplet(idx.map((i) => notes[i]), { num_notes: 3, notes_occupied: 2 }),
  )
}

interface BuiltVoice {
  hand: Hand
  voice: Voice
  tuplets: Tuplet[]
}

function buildHand(
  bar: Bar,
  hand: Hand,
  clef: 'treble' | 'bass',
  globalIdx: number,
  noteRefs: Map<string, StaveNote>,
): BuiltVoice[] {
  return barLayers(bar, hand).map((tokens, layerIdx) => {
    const notes = tokens.map((t) => buildTickable(t, clef, layerIdx > 0))
    notes.forEach((n, ti) => {
      if (n instanceof StaveNote) noteRefs.set(`${globalIdx}:${hand}:${layerIdx}:${ti}`, n)
    })
    const voice = new Voice({ num_beats: bar.beats, beat_value: 4 }).setStrict(false)
    voice.addTickables(notes)
    return { hand, voice, tuplets: collectTuplets(tokens, notes) }
  })
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
