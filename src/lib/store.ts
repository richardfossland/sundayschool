import { create } from 'zustand'
import type { HandFilter } from '@/types/song'
import type { InstrumentId } from '@/lib/instruments'

// Re-exported so existing `import type { InstrumentId } from '@/lib/store'`
// call sites keep working; the canonical definition lives in lib/instruments.
export type { InstrumentId }

// Transport + practice state shared between the playback engine and the UI.
// Same philosophy as SundayLicks: `currentBeat` is the ONE time source — the
// falling-notes canvas, the keyboard highlight and the section indicator are all
// DERIVED from it (a note sounds when t ≤ currentBeat < t + d), so audio and
// visuals never drift apart. The engine writes `currentBeat`/`isPlaying`; the UI
// writes the controls (bpm/targetKey/hand/loop/…) and the engine reads them.

/** The plain data fields (everything except the setter functions). */
export interface PlayerData {
  isPlaying: boolean
  isLoading: boolean // sampler loading on first play
  currentBeat: number
  /** Playback tempo in BPM. Changing it retimes live without repitching. */
  bpm: number
  /** Target key as a pitch class 0–11 (0 = C). The UI derives the semitone
   * offset from the song's original_key and hands it to engine.build(). */
  targetKey: number
  /** Which hand(s) sound: 'both' | 'L' | 'R' (per-hand / band practice). */
  hand: HandFilter
  /** A-B loop as [startBeat, endBeat], or null for the whole song. */
  loop: [number, number] | null
  /** Section currently selected in the SectionNav (for looping / progress). */
  activeSectionId: string | null
  /** Wait-mode: hold at each note until the player presses the right key. */
  waitMode: boolean
  /** How many beats ahead the falling-notes view previews. */
  lookaheadBeats: number
  metronome: boolean // click on every beat during playback
  countIn: boolean // one bar of clicks before playback starts
  /** Who last started the ONE global transport. Several small players (e.g. a
   * setlist's intro widgets) can be mounted at once; each compares this to its
   * own id so only the one actually sounding renders as "playing". */
  transportOwner: string | null

  // ── Skolen v2 — multi-instrument fields (additive) ──────────────────────────
  /** Band-modus: play the song as an ensemble rather than a single instrument. */
  bandMode: boolean
  /** Per-instrument gain 0–1 in band-modus (absent = default level). */
  bandMix: Partial<Record<InstrumentId, number>>
  /** Selected strum/rytme pattern id for gitar (null = none). */
  strumPattern: string | null
  /** Capo fret for gitar (0 = open). */
  capo: number
}

interface PlayerState extends PlayerData {
  /** Generic patch setter (used by the engine, mirrors the SundayLicks store). */
  set: (patch: Partial<PlayerData>) => void
  // Named setters for UI ergonomics — W4 builds against these.
  setBpm: (bpm: number) => void
  setTargetKey: (targetKey: number) => void
  setHand: (hand: HandFilter) => void
  setLoop: (loop: [number, number] | null) => void
  setActiveSection: (activeSectionId: string | null) => void
  setWaitMode: (waitMode: boolean) => void
  setLookaheadBeats: (lookaheadBeats: number) => void
  toggleMetronome: () => void
  toggleCountIn: () => void
  setTransportOwner: (transportOwner: string | null) => void
  // Skolen v2 setters.
  setBandMode: (bandMode: boolean) => void
  setBandMix: (bandMix: Partial<Record<InstrumentId, number>>) => void
  setStrumPattern: (strumPattern: string | null) => void
  setCapo: (capo: number) => void
}

export const usePlayer = create<PlayerState>((set) => ({
  isPlaying: false,
  isLoading: false,
  currentBeat: 0,
  bpm: 80,
  targetKey: 0,
  hand: 'both',
  loop: null,
  activeSectionId: null,
  waitMode: false,
  lookaheadBeats: 4,
  metronome: false,
  countIn: false,
  transportOwner: null,
  bandMode: false,
  bandMix: {},
  strumPattern: null,
  capo: 0,
  set: (patch) => set(patch),
  setBpm: (bpm) => set({ bpm }),
  setTargetKey: (targetKey) => set({ targetKey }),
  setHand: (hand) => set({ hand }),
  setLoop: (loop) => set({ loop }),
  setActiveSection: (activeSectionId) => set({ activeSectionId }),
  setWaitMode: (waitMode) => set({ waitMode }),
  setLookaheadBeats: (lookaheadBeats) => set({ lookaheadBeats }),
  toggleMetronome: () => set((s) => ({ metronome: !s.metronome })),
  toggleCountIn: () => set((s) => ({ countIn: !s.countIn })),
  setTransportOwner: (transportOwner) => set({ transportOwner }),
  setBandMode: (bandMode) => set({ bandMode }),
  setBandMix: (bandMix) => set({ bandMix }),
  setStrumPattern: (strumPattern) => set({ strumPattern }),
  setCapo: (capo) => set({ capo }),
}))
