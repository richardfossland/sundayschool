# Nattrapport — gransking og opprydding av SundaySchool

**Natt til 2026-08-09** (påbegynt tidligere, fullført etter kvote-pauser).
Eier ba om full gjennomgang: «se over all kode om det er noen feil, eller noe
som kan gjøres mer effektivt». Utført som 3 granskere + 5 fiksere (Opus),
dirigert av Fable.

## Resultat i tall

| | |
|---|---|
| Granskingsfunn (alle empirisk belagt) | **~58** |
| Fikset i natt | **48** (alle S1 + alle S2 + de fleste S3) |
| Tester | 1352 → **1433** (alle grønne; nye er mutasjonstestet — fjern fiksen og testen feiler) |
| First Load JS, bibliotek-ruter | 296 → **199 kB gz** (/lovsang 359 → 203) |
| Commits | `527e61d` (F1+F2) · `9e49e40` (F3) · `81a5ba3` (F4+F5) — pushet til main |
| Deploy | **IKKE utført** — venter eksplisitt eier-OK |

## De viktigste feilene som er rettet

1. **Slutt-stoppen re-armertes aldri** — andre gjennomspilling av enhver sang
   stoppet aldri, og progresjons-tellere blåste seg opp per loop-runde.
2. **Slash-akkorder (C/E) fikk ters/kvint regnet fra bass-tonen** — 104 gale
   venstrehånds-/basstoner på tvers av biblioteket. Nå 0.
3. **Notasjonen**: noter over taktstrek deles nå med bindinger; lange verdier
   dekomponeres i stedet for å rundes stille (116 feilnoterte → 0); firstemmig
   noteres i to lag i stedet for å forkorte melodien; triol-braketter grupperes
   på slagsum. To nye korpus-invarianter (0 overfulle takter, 0 forkortede
   noter over alle 104 arrangementer) står som permanente tester.
4. **Vent-/besifringsmodus dekket kun første seksjon** — nå: eksplisitt valgt
   seksjon, ellers loop, ellers hele sangen.
5. **Gospel-satsene**: semitone-klaser og fyllnoter som gnisset mot melodien er
   borte (57+82 tilfeller → 0); alt-stemmen holder ≥ 3 halvtoners avstand.
6. **Fag-lekkasjer**: metronom/tell-inn/band-modus fra ett fag smittet ikke
   lenger inn i neste; samples overlever side-bytte (`release()` vs `dispose()`).
7. **«Fortsett der du slapp»** ser nå alle 11 fag (4 var usynlige).
8. **Ytelse**: 60 render/s i fire spillere → 15 Hz koalesert beat-driver;
   Tone.js/Supabase/seed-biblioteket lastes nå lazy.
9. **Mobil**: miksepult-fadere 16→44 px m/ touch-action, alle berøringsmål
   ≥ 44 px, nav-maske + Escape, overflyt-fiks på sangsidene.
10. **Seed-herding**: respekterer `draft`-status (nedtaks-mekanismen for
    `kontroller-melodi`-sanger fungerer nå), trekker tilbake slettede sanger
    (paginert mot PostgREST max_rows-fella), strict zod, `keyAgreement`-
    kryssjekk toneart ↔ fortegn, `--dry-run`-flagg.

## Bevisst IKKE gjort (vurdert og valgt bort / utsatt)

- **Enharmonisk staving med akkordkontekst** (mellomdominanters ledetoner
  staves etter toneart, ikke akkord — 88 noter over ALLE 13 transponeringer,
  sjeldent i praksis ved standard toneart). Størst risiko/verdi-forhold av
  restfunnene; anbefales som egen dagsoppgave.
- Tone.js ivrig-lasting på /rytme, /bladspill, /gehor (de ER lydøvelser).
- rAF-basert klokke stopper i helt bakgrunnede faner (pre-eksisterende;
  krever design-beslutning).
- `NotationSongLazy`-plassholderen er 200 px også for diskant-snutter (~85 px
  layoutskift ved lasting) — kosmetisk.
- package.json `"type": "module"`-warning fra seed-scriptet (ufarlig).

## Verifisering

`npm run check` (tsc + 1433 vitest) + `next build` + `cf:build` grønne.
Preview-røyk: spilleren spiller/stopper, band-panel og notasjon til stede,
0 konsollfeil. Full preview-regresjon av alle fag anbefales sammen med
eierens lyttetest (rAF kjører ikke i skjult panel, så *hørbar* verifisering
av beat-markeringene gjenstår).

## 👤 Eier-steg i morgen

1. **Deploy-OK** → jeg deployer `81a5ba3` og røyktester prod.
2. Etter deploy: kjør gjerne `npm run seed -- --dry-run` for å se den nye
   tilbaketrekkings-planen (skal vise 0 endringer).
3. Lyttetest: spill en sang to ganger på rad (slutt-stopp-fiksen), prøv
   vent-modus uten valgt seksjon (skal dekke hele sangen), og band-modus.
