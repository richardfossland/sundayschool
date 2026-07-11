'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plug, ListMusic, LayoutList, ArrowDownToLine, CheckCircle2 } from 'lucide-react'
import type { Song } from '@/types/song'
import { usePlayer } from '@/lib/store'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { nearestOffset, transposeChord, transposeDoc, transposeKeySignature } from '@/lib/transpose'
import { chordSymbol } from '@/lib/spelling'
import { recordPractice } from '@/lib/progress'
import { connectMidi, midiSupported, type MidiConnection } from '@/lib/midi'
import { useChordMode } from '@/lib/useChordMode'
import { shapesAtCapo } from '@/lib/guitar/capo'
import { defaultPatternFor, patternById, strumEvents } from '@/lib/guitar/strumming'
import { FallingChords } from '@/components/FallingChords'
import { ChordStrip } from '@/components/ChordStrip'
import { SectionNav } from '@/components/SectionNav'
import { ChordDiagram } from './ChordDiagram'
import { ChordSheet } from './ChordSheet'
import { CapoHelper } from './CapoHelper'
import { GuitarTransport } from './GuitarTransport'
import { StrumPatternPicker } from './StrumPatternPicker'
import { cn } from '@/lib/cn'

// ── GuitarPlayer — the gitar orchestrator ────────────────────────────────────
// SongPlayer's guitar sibling. Same transposition pipeline (nearestOffset →
// transposeDoc; targetKey IS the sounding key) plus one extra, grip-only
// dimension: the capo. Grips/diagrams/chord sheet show the PLAYED chords
// (sounding minus capo); playback strums the grips shifted back up by the capo,
// so what sounds always matches the target key. The engine's main piano track
// gets an empty note list — the strummed guitar extraTrack is the whole band.

const EPS = 1e-6

type View = 'fallende' | 'skjema'

interface Props {
  song: Song
}

export function GuitarPlayer({ song }: Props) {
  const isPlaying = usePlayer((s) => s.isPlaying)
  const isLoading = usePlayer((s) => s.isLoading)
  const currentBeat = usePlayer((s) => s.currentBeat)
  const bpm = usePlayer((s) => s.bpm)
  const targetKey = usePlayer((s) => s.targetKey)
  const loop = usePlayer((s) => s.loop)
  const metronome = usePlayer((s) => s.metronome)
  const countIn = usePlayer((s) => s.countIn)
  const capo = usePlayer((s) => s.capo)
  const strumPatternId = usePlayer((s) => s.strumPattern)

  const [view, setView] = useState<View>('fallende')
  const [practice, setPractice] = useState(false) // grep-øving (chord practice)
  const [midi, setMidi] = useState<MidiConnection | null>(null)
  const [midiError, setMidiError] = useState<string | null>(null)
  const [justRecorded, setJustRecorded] = useState(false)

  // Sounding doc: pure number transform, same as SongPlayer.
  const offset = useMemo(() => nearestOffset(song.original_key, targetKey), [song.original_key, targetKey])
  const doc = useMemo(() => transposeDoc(song.doc, offset), [song.doc, offset])

  // The capo dimension: grips shown are the PLAYED chords (sounding − capo).
  const playedChords = useMemo(() => doc.chords.map((c) => transposeChord(c, -capo)), [doc, capo])
  const playedKeySignature = useMemo(
    () => transposeKeySignature(doc.keySignature, -capo),
    [doc.keySignature, capo],
  )
  const shapes = useMemo(() => shapesAtCapo(doc.chords, capo), [doc, capo])

  // Strum pattern (store id, or the song meter's natural default).
  const pattern = useMemo(
    () => patternById(strumPatternId) ?? defaultPatternFor(doc.timeSignature),
    [strumPatternId, doc.timeSignature],
  )

  // The guitar extraTrack: grips at the capo, shifted back to sounding pitch.
  const guitarEvents = useMemo(
    () =>
      strumEvents(doc.chords, pattern, doc.beatsPerBar, doc.totalBeats, {
        shapes,
        transpose: capo,
        pickupBeats: doc.pickupBeats,
      }),
    [doc, pattern, shapes, capo],
  )

  const progressKey = `gitar:${song.slug}`

  // Live values the rebuild effect reads without re-triggering on their change.
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const loopRef = useRef(loop)
  loopRef.current = loop

  // Reset transport + gitar controls to the song's defaults on song change.
  useEffect(() => {
    const st = usePlayer.getState()
    st.set({
      targetKey: song.original_key,
      bpm: song.default_bpm,
      hand: 'both',
      loop: null,
      waitMode: false,
      activeSectionId: null,
      currentBeat: 0,
      capo: 0,
      strumPattern: null,
    })
  }, [song.slug, song.original_key, song.default_bpm])

  // Install the iOS audio unlock once; tear the engine down on leave.
  useEffect(() => {
    installAudioUnlock()
    return () => getEngine().dispose()
  }, [])

  // (Re)build when the sounding events change (key, capo or pattern). The main
  // track is the doc with NO notes — timing/meter fields still drive the
  // transport — and the strummed guitar is the only sounding extraTrack.
  useEffect(() => {
    const engine = getEngine()
    const wasPlaying = usePlayer.getState().isPlaying
    if (wasPlaying) engine.stop()
    engine.build(
      { ...doc, notes: [] },
      {
        hand: 'both',
        bpm: bpmRef.current,
        loop: loopRef.current !== null,
        transpose: 0,
        extraTracks: [{ instrument: 'guitar', events: guitarEvents, volumeDb: 0 }],
      },
    )
    const lp = loopRef.current
    engine.setLoopRange(lp ? lp[0] : null, lp ? lp[1] : null)
    if (wasPlaying) void engine.play()
  }, [doc, guitarEvents])

  // Keep the engine's loop range in sync with the UI (live, no rebuild).
  useEffect(() => {
    const engine = getEngine()
    engine.setLoop(loop !== null)
    engine.setLoopRange(loop ? loop[0] : null, loop ? loop[1] : null)
  }, [loop])

  // Grep-øving: step the SOUNDING chords (a MIDI guitar reports sounding
  // pitches — with a physical capo the grip already matches the target key).
  const onLoopComplete = useCallback(
    () => recordPractice(progressKey, bpmRef.current),
    [progressKey],
  )
  const chord = useChordMode(doc.chords, { range: null, onLoopComplete })

  // Route live MIDI to the trainer while practicing (handlers via ref so the
  // connection survives re-renders).
  const midiRoute = useRef<{ onNoteOn: (p: number) => void; onNoteOff: (p: number) => void }>({
    onNoteOn: () => {},
    onNoteOff: () => {},
  })
  midiRoute.current.onNoteOn = practice ? chord.noteOn : () => {}
  midiRoute.current.onNoteOff = practice ? chord.noteOff : () => {}

  // Enter/leave grep-øving: stop the transport on enter.
  useEffect(() => {
    if (practice) {
      getEngine().stop()
      chord.start()
    } else {
      chord.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice])

  // Record a completed pass when the loop wraps during playback.
  const prevBeatRef = useRef(0)
  useEffect(() => {
    if (!isPlaying) {
      prevBeatRef.current = currentBeat
      return
    }
    if (currentBeat < prevBeatRef.current - 0.5) recordPractice(progressKey, bpmRef.current)
    prevBeatRef.current = currentBeat
  }, [currentBeat, isPlaying, progressKey])

  // MIDI cleanup on unmount / reconnect.
  useEffect(() => () => midi?.dispose(), [midi])

  const onPlayToggle = () => {
    const engine = getEngine()
    if (usePlayer.getState().isPlaying) {
      engine.stop()
      recordPractice(progressKey, usePlayer.getState().bpm, usePlayer.getState().activeSectionId ?? undefined)
    } else {
      if (practice) setPractice(false)
      void engine.play()
    }
  }
  const onBpm = (v: number) => {
    usePlayer.getState().setBpm(v)
    getEngine().setTempo(v)
  }
  const onLoopToggle = () => {
    const cur = usePlayer.getState().loop
    usePlayer.getState().setLoop(cur ? null : [0, doc.totalBeats])
  }
  const onSelectSection = (s: { id: string; startBeat: number }) => {
    getEngine().seekTo(s.startBeat)
    usePlayer.getState().setActiveSection(s.id)
  }
  const onLoopSection = (s: { startBeat: number; endBeat: number }) => {
    const cur = usePlayer.getState().loop
    const same = cur && Math.abs(cur[0] - s.startBeat) < EPS && Math.abs(cur[1] - s.endBeat) < EPS
    usePlayer.getState().setLoop(same ? null : [s.startBeat, s.endBeat])
  }

  const onConnectMidi = async () => {
    setMidiError(null)
    try {
      const conn = await connectMidi({
        onNoteOn: (pitch) => midiRoute.current.onNoteOn(pitch),
        onNoteOff: (pitch) => midiRoute.current.onNoteOff(pitch),
      })
      if (!conn) setMidiError('MIDI støttes ikke her — bruk Chrome/Edge, eller marker manuelt med «Spilt ✓».')
      else setMidi(conn)
    } catch (e) {
      setMidiError(e instanceof Error ? e.message : 'Kunne ikke koble til MIDI-gitar.')
    }
  }

  // Manual practice mark («Spilt ✓») — the non-MIDI path to progress.
  const onMarkPlayed = () => {
    recordPractice(progressKey, usePlayer.getState().bpm)
    setJustRecorded(true)
    setTimeout(() => setJustRecorded(false), 1600)
  }

  // Active/next chord (index space shared by doc.chords / playedChords / shapes).
  const playbackIdx = useMemo(() => {
    let idx = -1
    doc.chords.forEach((c, i) => {
      if (c.t <= currentBeat + EPS && currentBeat < c.t + c.d - EPS) idx = i
    })
    return idx
  }, [doc, currentBeat])
  const activeIdx = practice ? chord.index : playbackIdx
  const nextIdx = activeIdx >= 0 && activeIdx + 1 < playedChords.length ? activeIdx + 1 : -1

  const stripBeat = practice ? (chord.currentBeat ?? 0) : currentBeat

  // Falling-canvas width tracks the container (diagrams sit beside it).
  const fallRef = useRef<HTMLDivElement>(null)
  const [fallWidth, setFallWidth] = useState(720)
  useEffect(() => {
    const el = fallRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setFallWidth(Math.max(280, el.clientWidth)))
    ro.observe(el)
    setFallWidth(Math.max(280, el.clientWidth))
    return () => ro.disconnect()
  }, [view])

  const diagramFor = (idx: number, muted: boolean) => {
    if (idx < 0) return null
    const c = playedChords[idx]
    const label = chordSymbol(c.r, c.q, playedKeySignature, c.b)
    const shape = shapes.get(idx)
    return shape ? (
      <ChordDiagram shape={shape} label={label} muted={muted} />
    ) : (
      <div className="flex w-[110px] flex-col items-center gap-1 py-4 text-center">
        <span className="font-display text-base" style={{ color: 'var(--fag-gitar)' }}>{label}</span>
        <span className="text-xs text-[var(--color-muted)]">uten grep</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: MIDI status + view/practice toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-muted)]">
          {midi ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-sea)]">
              <Plug className="h-4 w-4" /> {midi.deviceNames[0] ?? 'MIDI tilkoblet'}
            </span>
          ) : (
            'Spill med — eller koble til en MIDI-gitar for grep-øving'
          )}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-[var(--color-border)]">
            {(
              [
                { id: 'fallende', label: 'Fallende', icon: ArrowDownToLine },
                { id: 'skjema', label: 'Skjema', icon: LayoutList },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-pressed={view === id}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 text-sm transition-colors',
                  view === id
                    ? 'bg-[var(--fag-gitar)]/15 text-[var(--fag-gitar)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPractice((v) => !v)}
            aria-pressed={practice}
            title="Øv på grepene i rekkefølge (MIDI-gitar validerer)"
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
              practice
                ? 'border-[var(--fag-gitar)] text-[var(--fag-gitar)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
            )}
          >
            <ListMusic className="h-4 w-4" /> Grep-øving
          </button>
          {midiSupported() && !midi && (
            <button
              onClick={onConnectMidi}
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
            >
              <Plug className="h-4 w-4" /> Koble til MIDI
            </button>
          )}
          <button
            onClick={onMarkPlayed}
            title="Marker sangen som øvd i dag"
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
              justRecorded
                ? 'border-[var(--color-sea)] text-[var(--color-sea)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
            )}
          >
            <CheckCircle2 className="h-4 w-4" /> {justRecorded ? 'Registrert!' : 'Spilt ✓'}
          </button>
        </div>
      </div>
      {midiError && <p className="text-xs text-[var(--color-danger)]">{midiError}</p>}

      {/* Main surface: falling chords + grip diagrams, or the chord sheet */}
      {view === 'fallende' ? (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
          <div ref={fallRef} className="min-w-[280px] flex-1">
            <FallingChords
              chords={playedChords}
              keySignature={playedKeySignature}
              beatOverride={practice ? (chord.currentBeat ?? 0) : null}
              activeIndex={activeIdx >= 0 ? activeIdx : null}
              hit={practice && chord.feedback === 'valid'}
              widthPx={fallWidth}
              heightPx={280}
            />
          </div>
          <div className="flex shrink-0 items-start justify-center gap-2 sm:flex-col sm:justify-start">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                Nå
              </span>
              {diagramFor(activeIdx, false) ?? (
                <div className="grid h-[120px] w-[110px] place-items-center text-sm text-[var(--color-muted)]">—</div>
              )}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                Neste
              </span>
              {diagramFor(nextIdx, true) ?? (
                <div className="grid h-[120px] w-[110px] place-items-center text-sm text-[var(--color-muted)]">—</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <ChordSheet
          doc={doc}
          chords={playedChords}
          keySignature={playedKeySignature}
          currentBeat={stripBeat}
          onSeek={(beat) => {
            getEngine().seekTo(beat)
            usePlayer.getState().set({ currentBeat: beat })
          }}
        />
      )}

      <ChordStrip chords={playedChords} keySignature={playedKeySignature} currentBeat={stripBeat} />

      <SectionNav
        sections={doc.sections}
        currentBeat={stripBeat}
        loop={loop}
        onSelect={onSelectSection}
        onLoop={onLoopSection}
      />

      <CapoHelper
        chords={doc.chords}
        keySignature={doc.keySignature}
        capo={capo}
        onCapo={(c) => usePlayer.getState().setCapo(c)}
      />

      {practice ? (
        <p className="text-sm text-[var(--color-muted)]">
          Spill grepet{' '}
          {chord.currentChord && (
            <span className="font-display" style={{ color: 'var(--fag-gitar)' }}>
              {chord.index + 1} / {chord.total}
            </span>
          )}{' '}
          — hold det til det godkjennes (MIDI-gitar), eller bruk «Spilt ✓».
          {chord.feedback === 'wrong' && (
            <span className="text-[var(--color-danger)]"> Feil tone — prøv igjen.</span>
          )}
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <StrumPatternPicker
              activeId={pattern.id}
              onSelect={(id) => usePlayer.getState().setStrumPattern(id)}
              timeSignature={doc.timeSignature}
            />
          </div>
          <GuitarTransport
            isPlaying={isPlaying}
            isLoading={isLoading}
            onPlayToggle={onPlayToggle}
            bpm={bpm}
            onBpm={onBpm}
            targetKey={targetKey}
            onKey={(k) => usePlayer.getState().setTargetKey(k)}
            metronome={metronome}
            onMetronomeToggle={() => usePlayer.getState().toggleMetronome()}
            countIn={countIn}
            onCountInToggle={() => usePlayer.getState().toggleCountIn()}
            loop={loop !== null}
            onLoopToggle={onLoopToggle}
          />
        </>
      )}
    </div>
  )
}
