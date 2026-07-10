import {
  Piano,
  Guitar,
  Music2,
  Drum,
  Church,
  BookOpen,
  Ear,
  type LucideIcon,
} from 'lucide-react'

// ── Fag-register (Skolen v2) ──────────────────────────────────────────────────
// The single source of truth for the "school" of subjects. The launcher
// (app/page.tsx), the topbar nav (AppShell) and each fag-skeleton all read from
// here so a new subject is added in exactly one place. Piano is the only live
// subject in wave 0; the rest render a "kommer"-skeleton until later waves fill
// them in. Accent colours are the --fag-* CSS vars defined in globals.css.

export type SubjectId =
  | 'piano'
  | 'gitar'
  | 'bass'
  | 'trommer'
  | 'teologi'
  | 'teori'
  | 'gehor'

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
  },
  {
    id: 'gitar',
    label: 'Gitar',
    href: '/gitar',
    icon: Guitar,
    accent: 'var(--fag-gitar)',
    status: 'kommer',
    tier: 'primary',
    tagline: 'Grep, besifring og rytme',
  },
  {
    id: 'bass',
    label: 'Bass',
    href: '/bass',
    icon: Music2,
    accent: 'var(--fag-bass)',
    status: 'kommer',
    tier: 'primary',
    tagline: 'Grunntoner og gangbass',
  },
  {
    id: 'trommer',
    label: 'Trommer',
    href: '/trommer',
    icon: Drum,
    accent: 'var(--fag-trommer)',
    status: 'kommer',
    tier: 'primary',
    tagline: 'Grooves og komp',
  },
  {
    id: 'teologi',
    label: 'Teologi',
    href: '/teologi',
    icon: Church,
    accent: 'var(--fag-teologi)',
    status: 'kommer',
    tier: 'primary',
    tagline: 'Bibel, troslære og liturgi',
  },
  {
    id: 'teori',
    label: 'Teori',
    href: '/teori',
    icon: BookOpen,
    accent: 'var(--fag-teori)',
    status: 'kommer',
    tier: 'secondary',
    tagline: 'Skalaer, akkorder og harmoni',
  },
  {
    id: 'gehor',
    label: 'Gehør',
    href: '/gehor',
    icon: Ear,
    accent: 'var(--fag-gehor)',
    status: 'kommer',
    tier: 'secondary',
    tagline: 'Intervaller og gehørtrening',
  },
]

export const SUBJECT_BY_ID: Record<SubjectId, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s]),
) as Record<SubjectId, Subject>
