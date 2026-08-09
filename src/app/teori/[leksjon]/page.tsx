import { notFound } from 'next/navigation'
import { LessonShell, LessonSection } from '@/components/teori/LessonShell'
import { IntervalDemoLazy } from '@/components/teori/IntervalDemoLazy'
import { ChordBuilderLazy } from '@/components/teori/ChordBuilderLazy'
import { CircleOfFifths } from '@/components/teori/CircleOfFifths'
import { LESSONS, lessonIndex } from '../lessons'

// ── /teori/[leksjon] ──────────────────────────────────────────────────────────
// The four theory lessons. Each is Norwegian pedagogical prose (with a church-
// musician angle) interleaved with the interactive client demos. The shell and
// prev/next navigation come from the LESSONS registry, so ordering lives in one
// place.

export function generateStaticParams() {
  return LESSONS.map((l) => ({ leksjon: l.slug }))
}

// Lesson bodies, keyed by slug. Kept as components so prose and demos can be
// freely interleaved.
const BODIES: Record<string, () => React.ReactNode> = {
  intervaller: () => (
    <>
      <LessonSection title="Hva er et intervall?">
        <p>
          Et intervall er avstanden mellom to toner. Det er den minste byggesteinen i all musikk:
          en melodi er en kjede av intervaller, og en akkord er flere intervaller stablet oppå
          hverandre. Lærer du deg å kjenne igjen intervallene, har du nøkkelen til både gehør,
          akkorder og transponering.
        </p>
        <p>
          Vi måler intervaller i halvtoner — avstanden fra én tangent til nabotangenten, svart
          eller hvit. Fra C til D er det to halvtoner (en «stor sekund»), fra C til G er det sju
          (en «ren kvint»).
        </p>
      </LessonSection>

      <LessonSection title="Navnene">
        <p>
          Intervallnavnet har to deler: et tall som teller trinnene i skalaen (sekund, ters,
          kvart, kvint …) og en kvalitet (liten, stor eller ren). En liten ters er tre halvtoner,
          en stor ters fire. Kvarten, kvinten og oktaven kalles «rene» — de har bare én vanlig
          størrelse. Midt mellom kvart og kvint bor tritonus, spenningen selv.
        </p>
        <p>
          Trykk deg gjennom intervallene under. Lytt etter karakteren: tersen er myk, kvinten er
          åpen og hul, septimen lengter etter å løses opp.
        </p>
      </LessonSection>

      <IntervalDemoLazy />

      <LessonSection title="Intervaller i salmene">
        <p>
          Sangene du allerede kan er de beste knaggene. «Deilig er jorden» åpner med en ren
          kvart. «Amazing Grace» starter med en ren kvart opp til grunntonen — og hopper så en
          stor ters. Kjenner du igjen starten på en kjent salme, kjenner du igjen intervallet.
        </p>
        <p>
          Som kirkemusiker møter du intervallene hele tiden: bassisten spiller kvinter og
          oktaver, andrestemmen ligger ofte en ters under melodien, og forspillet lander gjerne
          på en septim som leder inn i første vers.
        </p>
      </LessonSection>

      <LessonSection title="Videre">
        <p>
          Når intervallene sitter i øret, er neste steg å stable dem: tre toner med ters-avstand
          blir en akkord. Det er neste leksjon — og i Gehør-faget kan du drille
          intervallgjenkjenning med stigende vanskelighetsgrad.
        </p>
      </LessonSection>
    </>
  ),

  akkorder: () => (
    <>
      <LessonSection title="Treklangen — tre toner i ters">
        <p>
          En akkord er tre eller flere toner som klinger samtidig. Grunnformen er treklangen:
          grunntone, ters og kvint — altså to terser stablet oppå hverandre. Hvilken type ters
          som ligger nederst avgjør om akkorden er dur (stor ters, lys og åpen) eller moll
          (liten ters, mørkere og mykere).
        </p>
        <p>
          Dur og moll er arbeidshestene i alt fra Bach-koraler til moderne lovsang. Klarer du å
          høre forskjellen på dem, har du kommet langt — det er også nivå 1 i gehørtreningen.
        </p>
      </LessonSection>

      <LessonSection title="Firklanger og farger">
        <p>
          Legger du på enda en ters får du en firklang. Septimakkorden (C7) driver musikken
          fremover — den vil videre til neste akkord. Maj7 er drømmende og stillestående, m7 er
          rund og gospelvarm. I moderne lovsang møter du også sus4 (kvarten «holder igjen»
          tersen) og add9 (en ekstra farge oppå durklangen).
        </p>
        <p>Bygg akkordene selv under — velg grunntone og kvalitet, se tonene og lytt.</p>
      </LessonSection>

      <ChordBuilderLazy />

      <LessonSection title="Funksjoner: I, IV og V">
        <p>
          I en toneart har hvert skalatrinn sin egen akkord. Vi nummererer dem med romertall:
          store tall for dur (I, IV, V), små for moll (ii, iii, vi) og en liten sirkel for den
          forminskede (vii°). I C-dur blir det C, Dm, Em, F, G, Am og Hdim.
        </p>
        <p>
          De tre viktigste er I (tonika — hjemme), IV (subdominant — underveis) og V (dominant —
          spenning som vil hjem). Utallige salmer og gospelsanger klarer seg med bare disse tre.
          Kjenner du funksjonene, kan du flytte hele sangen til en ny toneart uten å tenke — det
          er derfor besifringen i SundaySchool også kan vises som trinn.
        </p>
      </LessonSection>

      <LessonSection title="Videre">
        <p>
          Neste leksjon gir deg kartet over alle toneartene — kvintsirkelen — og viser hvorfor
          akkurat I, IV og V er naboer.
        </p>
      </LessonSection>
    </>
  ),

  kvintsirkelen: () => (
    <>
      <LessonSection title="Kartet over toneartene">
        <p>
          Ordner du de tolv toneartene slik at hvert steg med klokka er en ren kvint opp, får du
          kvintsirkelen. C-dur står øverst uten fortegn. Ett steg med klokka gir G-dur med én
          kryss; ett steg mot klokka gir F-dur med én b. Jo lenger fra C, desto flere fortegn.
        </p>
        <p>
          Sirkelen er ikke bare en huskeregel for fortegn — den viser hvilke tonearter som er i
          slekt. Naboer på sirkelen deler seks av sju toner, så overgangen mellom dem klinger
          naturlig.
        </p>
      </LessonSection>

      <CircleOfFifths />

      <LessonSection title="Relativ moll — samme nøkkel, ny stemning">
        <p>
          I den indre ringen bor molltoneartene. Hver durtoneart har en «relativ moll» som deler
          nøyaktig samme fortegn: a-moll hører til C-dur, e-moll til G-dur. Det er samme sju
          toner — bare med et annet tyngdepunkt. Mange salmer vandrer mellom dur og relativ moll
          i løpet av et vers uten at du merker sømmen.
        </p>
      </LessonSection>

      <LessonSection title="Naboene er akkordene dine">
        <p>
          Se på en toneart på sirkelen: naboen med klokka er dominanten (V), naboen mot klokka
          er subdominanten (IV). I C-dur er det G og F — de tre akkordene som bærer mesteparten
          av salmeboka står altså vegg i vegg. Skal du lære deg en ny toneart, start med å finne
          de to naboene.
        </p>
        <p>
          Sirkelen forklarer også hvorfor «å gå en kvint opp» føles som den mest naturlige
          modulasjonen: du flytter deg bare ett hakk på kartet.
        </p>
      </LessonSection>

      <LessonSection title="Videre">
        <p>
          Siste leksjon handler om å bruke kartet i praksis: hva som faktisk skjer når
          forsangeren vil ta sangen «en tone opp».
        </p>
      </LessonSection>
    </>
  ),

  tonearter: () => (
    <>
      <LessonSection title="Hvorfor bytter forsangeren toneart?">
        <p>
          «Kan vi ta den i G i stedet?» Alle som har spilt på en gudstjeneste har hørt det.
          Grunnen er nesten alltid sangbarhet: originaltonearten passer ikke stemmen. Ligger
          melodien for høyt for menigheten, må hele sangen ned; synger forsangeren dypt, må den
          opp. Melodiens toppnote bør sjelden over D–E for allsang.
        </p>
        <p>
          Å flytte en sang til en ny toneart kalles å transponere. Alt flyttes like langt: hver
          tone, hver akkord — intervallene imellom er nøyaktig de samme. Det er derfor sangen
          fortsatt «er seg selv» i den nye tonearten.
        </p>
      </LessonSection>

      <LessonSection title="Fortegnene — toneartens signatur">
        <p>
          Hver toneart har sin faste samling kryss eller b-er, skrevet først på notelinjen.
          Fortegnene forteller hvilke toner som hører hjemme: Eb-dur har tre b-er (Bb, Eb og Ab),
          D-dur har to kryss (F# og C#). Rekkefølgen er alltid den samme — kryssene kommer i
          kvintavstand (F C G D A E H), b-ene i motsatt rekkefølge.
        </p>
        <p>Bruk sirkelen under til å slå opp fortegnene for en toneart du lurer på.</p>
      </LessonSection>

      <CircleOfFifths />

      <LessonSection title="Transponering i praksis">
        <p>
          Tenk i trinn, ikke i toner. Er sangen C–F–G–C (I–IV–V–I), er den G–C–D–G i G-dur og
          Eb–Ab–Bb–Eb i Eb-dur. Funksjonene er identiske; bare startpunktet flytter seg. Det er
          også slik transponeringen i SundaySchool virker: velg måltoneart i spilleren, så
          flyttes fallende noter, notasjon og besifring sammen — uten at noe spilles inn på nytt.
        </p>
        <p>
          Et halvtonesteg opp midt i siste refreng er gospel-klassikeren: løftet alle kjenner i
          magen. Nå vet du hva som skjer — hele kartet forskyves ett hakk.
        </p>
      </LessonSection>

      <LessonSection title="Vanlige tonearter i kirken">
        <p>
          Salmebøker elsker F, G, Eb og D — tonearter med få fortegn som ligger godt for
          menighetssang. Gospelpianister ender ofte i Db og Ab, der de svarte tangentene lar
          hendene ligge godt. Ikke vær redd for mange fortegn: på sirkelen ser du at Ab bare er
          fire steg fra C — og fingrene lærer seg veien fortere enn du tror.
        </p>
      </LessonSection>

      <LessonSection title="Videre">
        <p>
          Dette var teorigrunnlaget. Ta det med inn i Gehør-faget og tren øret — eller åpne en
          salme i Piano-faget og prøv å transponere den selv.
        </p>
      </LessonSection>
    </>
  ),
}

export default async function LeksjonPage({
  params,
}: {
  params: Promise<{ leksjon: string }>
}) {
  const { leksjon } = await params
  const i = lessonIndex(leksjon)
  const body = BODIES[leksjon]
  if (i === -1 || !body) notFound()

  const meta = LESSONS[i]
  const prev = i > 0 ? LESSONS[i - 1] : undefined
  const next = i < LESSONS.length - 1 ? LESSONS[i + 1] : undefined

  return (
    <LessonShell
      title={meta.title}
      intro={meta.tagline}
      prev={prev && { href: `/teori/${prev.slug}`, label: prev.title }}
      next={next && { href: `/teori/${next.slug}`, label: next.title }}
    >
      {body()}
    </LessonShell>
  )
}
