import { FagUnderConstruction } from '@/components/FagUnderConstruction'
import { SUBJECT_BY_ID } from '@/lib/subjects'

// Stub — v3 bølge 3 (W3A) erstatter innholdet; behold FagUnderConstruction-
// headerens struktur (tilbake-lenke + fag-header) i den ekte siden.
export default function LovsangPage() {
  return <FagUnderConstruction subject={SUBJECT_BY_ID.lovsang} />
}
