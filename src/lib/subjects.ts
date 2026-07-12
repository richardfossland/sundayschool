import {
  Piano,
  Guitar,
  Music2,
  Drum,
  Church,
  BookOpen,
  Ear,
  FileMusic,
  AudioLines,
  Mic,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'

// ── Fag-register (Skolen v2) ──────────────────────────────────────────────────
// The single source of truth for the "school" of subjects. The launcher
// (app/page.tsx), the topbar nav (AppShell) and each fag-skeleton all read from
// here so a new subject is added in exactly one place. All seven subjects went
// live in wave 1. Accent colours are the --fag-* CSS vars defined in globals.css.

export type SubjectId =
  | 'piano'
  | 'gitar'
  | 'bass'
  | 'trommer'
  | 'teologi'
  | 'lovsang'
  | 'teori'
  | 'gehor'
  | 'bladspill'
  | 'rytme'
  | 'lydteknikk'

export interface Subject {
  id: SubjectId
  label: string
  href: string
  icon: LucideIcon
  /** CSS accent, e.g. 'var(--fag-piano)'. */
  accent: string
  status: 'active' | 'kommer'
  /** primary = main nav + large launcher cards; secondary = Teori/Gehør. */
  tier: 'primary' | 'secondary'
  /** One-line description for the launcher card. */
  tagline: string
  /** A short "hva du lærer"-line for the large launcher cards. */
  learn: string
}

export const SUBJECTS: Subject[] = [
  {
    id: 'piano',
    label: 'Piano',
    href: '/piano',
    icon: Piano,
    accent: 'var(--fag-piano)',
    status: 'active',
    tier: 'primary',
    tagline: 'Fallende noter, notasjon og transponering',
    learn: 'Spill salmer og lovsang med vent-modus og fire vanskelighetsnivåer',
  },
  {
    id: 'gitar',
    label: 'Gitar',
    href: '/gitar',
    icon: Guitar,
    accent: 'var(--fag-gitar)',
    status: 'active',
    tier: 'primary',
    tagline: 'Grep, besifring og rytme',
    learn: 'Grep-diagrammer, capo og strumming over hele repertoaret',
  },
  {
    id: 'bass',
    label: 'Bass',
    href: '/bass',
    icon: Music2,
    accent: 'var(--fag-bass)',
    status: 'active',
    tier: 'primary',
    tagline: 'Grunntoner og gangbass',
    learn: 'Rot, kvint og vandrende gangbass generert fra besifringen',
  },
  {
    id: 'trommer',
    label: 'Trommer',
    href: '/trommer',
    icon: Drum,
    accent: 'var(--fag-trommer)',
    status: 'active',
    tier: 'primary',
    tagline: 'Grooves og komp',
    learn: 'Øv grooves og fills, eller komp til en sang med generert trommespor',
  },
  {
    id: 'teologi',
    label: 'Teologi',
    href: '/teologi',
    icon: Church,
    accent: 'var(--fag-teologi)',
    status: 'active',
    tier: 'primary',
    tagline: 'Bibel, troslære og liturgi',
    learn: 'Salmehistorier, bibelvers, katekismen og kirkeårets rytme',
  },
  {
    id: 'teori',
    label: 'Teori',
    href: '/teori',
    icon: BookOpen,
    accent: 'var(--fag-teori)',
    status: 'active',
    tier: 'secondary',
    tagline: 'Skalaer, akkorder og harmoni',
    learn: 'Intervaller, akkorder, kvintsirkelen og tonearter',
  },
  {
    id: 'gehor',
    label: 'Gehør',
    href: '/gehor',
    icon: Ear,
    accent: 'var(--fag-gehor)',
    status: 'active',
    tier: 'secondary',
    tagline: 'Intervaller og gehørtrening',
    learn: 'Hør intervaller, akkordkvalitet og melodidiktat i korte økter',
  },
  {
    id: 'lovsang',
    label: 'Lovsang',
    href: '/lovsang',
    icon: Mic,
    accent: 'var(--fag-lovsang)',
    status: 'active',
    tier: 'primary',
    tagline: 'Setlister, tonearter og overganger',
    learn: 'Bygg søndagens setliste med toneartsflyt, overganger og intro-øving',
  },
  {
    id: 'bladspill',
    label: 'Bladspill',
    href: '/bladspill',
    icon: FileMusic,
    accent: 'var(--fag-bladspill)',
    status: 'kommer',
    tier: 'secondary',
    tagline: 'Les noter fra bladet',
    learn: 'Genererte leseoppgaver i tre nivåer — mål lesehastigheten din',
  },
  {
    id: 'rytme',
    label: 'Rytme',
    href: '/rytme',
    icon: AudioLines,
    accent: 'var(--fag-rytme)',
    status: 'kommer',
    tier: 'secondary',
    tagline: 'Les og tapp rytmer',
    learn: 'Rytmelesing med timing-feedback og rytmisk diktat',
  },
  {
    id: 'lydteknikk',
    label: 'Lydteknikk',
    href: '/lydteknikk',
    icon: SlidersHorizontal,
    accent: 'var(--fag-lydteknikk)',
    status: 'kommer',
    tier: 'secondary',
    tagline: 'For lydteamet',
    learn: 'Gain-struktur, EQ og monitor — med interaktiv miksepult',
  },
]

export const SUBJECT_BY_ID: Record<SubjectId, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s]),
) as Record<SubjectId, Subject>
