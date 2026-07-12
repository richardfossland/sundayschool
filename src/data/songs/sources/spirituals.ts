import type { SongSource } from '@/types/song-source'

// ── Spirituals (verk-kilder) ─────────────────────────────────────────────────
// Fylles av innholdsbølgene (W4B): Go Down Moses, Deep River, Nobody Knows,
// Down by the Riverside, Wade in the Water … Hver kilde håndskrives ÉN gang
// (melodi + akkorder + rettigheter) og blir til spillbare arrangementer via
// lib/arranger/piano-arrangement.ts. Se sources/jul.ts for et komplett
// eksempel; bruk `line`/`ch` fra ../_helpers.ts (husk .ts-endelser i relative
// imports — seed-scriptet kjører via Node type-stripping). Melodi: kun h:'R',
// monofon, C3–C6; gehør-transkribert melodi tagges 'kontroller-melodi'.

export const spiritualSources: SongSource[] = []
