import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { LessonShell, LessonSection } from '@/components/teori/LessonShell'
import { MikserSimLazy } from '@/components/lydteknikk/MikserSimLazy'
import { LessonComplete } from '@/components/lydteknikk/LessonComplete'
import { LESSONS, lessonIndex } from '../lessons'

// ── /lydteknikk/[leksjon] ─────────────────────────────────────────────────────
// The four sound-tech lessons. Each is Norwegian, church-angled, volunteer-
// friendly prose interleaved with the MikserSim (built on-demand). Shell,
// accent, icon and prev/next come from the shared LessonShell + the LESSONS
// registry. A "Fullført"-button (LessonComplete) closes every lesson and records
// local progress under `lydteknikk:{slug}`.

export function generateStaticParams() {
  return LESSONS.map((l) => ({ leksjon: l.slug }))
}

const BODIES: Record<string, () => React.ReactNode> = {
  signalkjeden: () => (
    <>
      <LessonSection title="Fra munn til høyttaler">
        <p>
          Alt lyd på en gudstjeneste følger den samme reisen. En sanger synger inn i en{' '}
          <em>mikrofon</em>. Signalet kommer inn i mikserbordet og møter først en{' '}
          <em>gain</em> (også kalt trim) — det aller første volumtrinnet. Derfra går det videre til
          en <em>fader</em>, samles med de andre kanalene i en <em>buss</em>, gjennom en felles{' '}
          <em>master</em>, ut til <em>forsterkeren</em> og til slutt ut av høyttalerne i salen.
        </p>
        <p>
          Denne rekken av trinn kaller vi signalkjeden. Lyden blir aldri bedre enn det svakeste
          leddet — og nesten alle vanlige problemer skyldes at nivået er satt feil ett sted i
          kjeden. Derfor er det verdt å forstå hva hvert trinn faktisk gjør.
        </p>
      </LessonSection>

      <LessonSection title="Gain er ikke det samme som volum">
        <p>
          Dette er den viktigste setningen i hele faget: gain og fader gjør to forskjellige ting.{' '}
          <strong>Gain</strong> bestemmer hvor sterkt signalet er <em>når det kommer inn</em> i
          bordet — du setter den én gang under lydsjekk, så mikrofonen ligger på et sunt nivå.{' '}
          <strong>Faderen</strong> bruker du hele tiden underveis, til å balansere kanalene mot
          hverandre: litt mer vokal her, litt mindre gitar der.
        </p>
        <p>
          Setter du gain for lavt, må du dra faderen langt opp for å høre noe — og da drar du med
          deg all støyen i bunnen. Setter du gain for høyt, er signalet allerede altfor sterkt før
          faderen i det hele tatt har gjort jobben sin. God «gain-struktur» betyr at hvert trinn
          får et signal som er passe sterkt: ikke så svakt at det drukner, ikke så sterkt at det
          knekker.
        </p>
      </LessonSection>

      <LessonSection title="Derfor klipper lyden">
        <p>
          Digital lyd har et tak. Når summen av alle kanalene blir sterkere enn dette taket (0
          dBFS), klarer ikke systemet å gjengi bølgen — toppene blir kuttet rett av, og det høres
          som en stygg, sprakende forvrengning. Det kalles å <em>klippe</em>. På bordet lyser det
          som regel en rød «peak»- eller «clip»-lampe idet det skjer.
        </p>
        <p>
          Klipping kan skje hvor som helst i kjeden: for høy gain klipper inngangen, for mange
          kanaler oppå hverandre klipper bussen, for høy master klipper utgangen. Løsningen er
          alltid den samme — finn hvor det er for hett, og ta ned nivået <em>der</em>, ikke bare
          skru ned helt til slutt.
        </p>
      </LessonSection>

      <LessonSection title="Prøv selv: få vokalen fram">
        <p>
          Under er en liten miksepult med tre kanaler: trommer, bass og en «vokal» (en enkel
          melodi som står inne for sangeren). Trykk <strong>Start</strong> og hør bandet.
          Vokalkanalen ligger helt nede — akkurat som når en sanger nettopp har koblet seg til.
        </p>
        <p>
          <strong>Oppgaven din:</strong> dra vokalfaderen opp til du hører melodien tydelig over
          bandet — men uten at den røde CLIP-lampen på masteren slår inn. Klarer du det bare med
          faderen? Prøv også å ta ned trommer og bass et hakk i stedet: ofte handler god lyd like
          mye om å skru <em>ned</em> som å skru opp.
        </p>
      </LessonSection>

      <MikserSimLazy />

      <LessonSection title="Sikt på sunt headroom">
        <p>
          «Headroom» er avstanden opp til taket — pusterommet ditt. En god tommelfingerregel er å
          la de sterkeste toppene ligge et godt stykke under 0, slik at et uventet rop i
          mikrofonen eller et ekstra kraftig refreng ikke skyver deg rett i klipp. Litt luft på
          toppen er alltid bedre enn å ligge og skrape i taket.
        </p>
        <p>
          Når gain-strukturen sitter, blir alt annet enklere: faderne ligger fint midt i
          området, du har rom til å skru både opp og ned, og lyden er ren. Det er fundamentet vi
          bygger EQ og monitor oppå i de neste leksjonene.
        </p>
      </LessonSection>
    </>
  ),

  eq: () => (
    <>
      <LessonSection title="Lyd i tre etasjer">
        <p>
          EQ (equalizer) lar deg skru opp og ned på bestemte deler av lydbildet — ikke hele
          kanalen, men et frekvensområde om gangen. Tenk på lyden som et hus i tre etasjer:{' '}
          <strong>bassen</strong> i kjelleren (kick, basstoner, kroppen i en stemme),{' '}
          <strong>mellomtonen</strong> i midten (der det meste av en stemme og en gitar bor og der
          ordene blir tydelige) og <strong>toppen</strong> på loftet (luft, klang, s-lyder,
          cymbaler).
        </p>
        <p>
          De fleste bord har minst tre bånd: en lav, en mellom og en høy. Litt boost eller kutt
          det rette stedet kan gjøre en grøtete miks klar og luftig — eller redde en skarp stemme
          som skjærer i ørene.
        </p>
      </LessonSection>

      <LessonSection title="Kutt før du løfter">
        <p>
          Den beste vanen i EQ er å tenke <em>subtraktivt</em>: fjern det som plager før du skrur
          opp det fine. Er stemmen dus og utydelig, er det ofte fordi mellomtonen er dekket av for
          mye bunn — så et lite kutt i bassen gjør mer enn en boost i toppen. Hver gang du løfter
          noe, løfter du også nivået totalt (husk klipp fra forrige leksjon); kutter du i stedet,
          rydder du plass uten å presse nivået oppover.
        </p>
        <p>
          Vær varsom. Store bevegelser høres fort kunstig ut. Små, bevisste justeringer — et par
          dB her og der — er nesten alltid nok i et vanlig kirkerom.
        </p>
      </LessonSection>

      <LessonSection title="To klassiske kirkeromsplager">
        <p>
          <strong>Buldring</strong> er den vanligste: rommet, orgelet eller en nærmikk gir en tung,
          grumsete bunn som legger seg som tåke over alt. Et forsiktig kutt i det lave båndet
          rydder som regel opp. <strong>Hvesing</strong> er den andre: skarpe s-er og en stemme
          som «skjærer». Da er det toppen — eller øvre mellomtone — som er for påtrengende, og et
          lite kutt der roer det ned.
        </p>
        <p>
          Regelen er enkel: hører du noe ubehagelig, prøv å <em>ta bort</em> det området før du
          gjør noe annet. Øret ditt er det viktigste verktøyet — EQ-en er bare måten du følger opp
          det du hører.
        </p>
      </LessonSection>

      <LessonSection title="Prøv selv: form lyden">
        <p>
          Hver kanal i pulten under har tre EQ-bånd (Lav, Mid, Topp) og en liten kurve som viser
          hva du gjør. Trykk <strong>Start</strong> og eksperimenter.
        </p>
        <p>
          <strong>Oppgaven din:</strong> gjør bassen mindre grumsete ved å kutte litt i det lave
          båndet på trommer og bass. Løft så et lite hakk i toppen på vokalen så melodien får litt
          luft. Legg merke til hvordan kurven flytter seg — og hvordan meterne og CLIP-lampen
          reagerer når du løfter i stedet for å kutte.
        </p>
      </LessonSection>

      <MikserSimLazy />

      <LessonSection title="Videre">
        <p>
          Nå former du lyden på hver enkelt kanal. Neste leksjon handler om noe litt annet: at
          musikerne på scenen trenger en helt annen miks enn folk i salen — og hvordan du unngår
          den fryktede rundgangen.
        </p>
      </LessonSection>
    </>
  ),

  'monitor-og-sal': () => (
    <>
      <LessonSection title="To mikser, ett band">
        <p>
          Det finnes to helt forskjellige lyttere på en gudstjeneste. Den ene er menigheten i
          salen — de skal høre en ferdig, balansert miks fra hovedhøyttalerne. Vi kaller den{' '}
          <strong>FOH</strong> («front of house»), eller bare «sal». Den andre er musikerne på
          scenen, som hører seg selv gjennom <strong>monitorer</strong> (gulvhøyttalere eller
          in-ear). Din jobb er å lage begge to — samtidig — og de skal nesten aldri være like.
        </p>
      </LessonSection>

      <LessonSection title="Hvorfor musikerne trenger noe annet">
        <p>
          Menigheten vil ha helheten. En musiker vil ha det <em>hun</em> trenger for å spille
          riktig: forsangeren vil høre seg selv og litt piano for å holde tonen; trommeslageren vil
          ha bass og en klikk for å holde tempo; bassisten vil ha kick og vokal. Gir du dem den
          samme miksen som salen, drukner det de trenger mest i alt det andre.
        </p>
        <p>
          Derfor har hver kanal en egen <strong>monitor-send</strong>: hvor mye av den kanalen som
          skal ut i monitormiksen, helt uavhengig av faderen som styrer salen. Du kan ha vokalen
          lavt i salen og likevel høyt i sangerens monitor. I pulten i de andre leksjonene er det
          nettopp dette «Lytt: Sal / Monitor»-bryteren lar deg høre — samme band, to helt ulike
          balanser.
        </p>
      </LessonSection>

      <LessonSection title="Rundgang — og de tre knappene mot den">
        <p>
          Rundgang (feedback) er den ulende tonen alle frykter. Den oppstår i en sløyfe: lyd fra en
          monitor eller høyttaler går inn i en åpen mikrofon, ut igjen, inn igjen — og bygger seg
          opp til en pipetone. Tre ting avgjør om det skjer:
        </p>
        <p>
          <strong>Retning:</strong> pek aldri en monitor rett inn i en mikrofon, og hold
          mikrofonen bort fra hovedhøyttalerne. <strong>Avstand:</strong> jo nærmere sangeren står
          mikrofonen, desto sterkere er stemmen i forhold til rommet — og desto mindre gain trenger
          du, som gir mindre rundgang. <strong>Frekvens:</strong> rundgang starter nesten alltid på
          én bestemt frekvens; finner du den med EQ-en og tar et lite kutt akkurat der, forsvinner
          pipingen uten at resten av lyden blir dårligere.
        </p>
        <p>
          Den enkleste kuren er ofte den kjedeligste: ta monitoren et hakk ned. En litt lavere,
          stabil monitor er alltid bedre enn en høy en som står og ringer.
        </p>
      </LessonSection>

      <LessonSection title="Prøv selv: bygg en monitormiks">
        <p>
          Trykk <strong>Start</strong> i pulten under og still den på <strong>Sal</strong> — lag en
          fin balanse for menigheten. Bytt så til <strong>Monitor</strong> og hør hvordan den
          samme sangen kan settes helt annerledes: skru opp monitor-sendene for det en musiker
          trenger, uavhengig av salmiksen.
        </p>
      </LessonSection>

      <MikserSimLazy />

      <LessonSection title="Videre">
        <p>
          Nå kan du både forme lyden og lage to mikser av den. Siste leksjon binder alt sammen til
          en rolig rutine du kan gå etter hver eneste søndag morgen.
        </p>
      </LessonSection>
    </>
  ),

  lydsjekk: () => (
    <>
      <LessonSection title="Rutinen som gjør deg trygg">
        <p>
          En god lydtekniker er ikke den som kan flest triks — det er den som har en fast rutine og
          holder hodet kaldt. Kommer du tidlig og gjør de samme stegene i samme rekkefølge hver
          gang, er du ferdig i god tid før folk kommer inn, og du vet at ingenting er glemt. Her er
          en enkel sjekkliste for søndag morgen.
        </p>
      </LessonSection>

      <LessonSection title="Én kilde av gangen">
        <p>
          Ikke skru på alt samtidig. Ta én mikrofon eller ett instrument av gangen: be musikeren
          spille eller synge, sett nivået, hør at det er rent — og gå så videre til neste. Prøver
          du å mikse alt på én gang, vet du aldri hvor et problem kommer fra. Én kilde av gangen er
          den enkleste måten å holde oversikt på.
        </p>
      </LessonSection>

      <LessonSection title="Gain før fader — alltid">
        <p>
          Dette er hele forrige uke i én setning: sett <strong>gain</strong> først, med faderen på
          et nøytralt utgangspunkt. Be om det kraftigste sangeren kommer til å gi deg, og still
          gain så toppene ligger sunt under taket. Først <em>når gain sitter</em> begynner du å
          balansere kanalene mot hverandre med faderne. Gjør du det motsatt, jager du deg selv i
          ring hele formiddagen.
        </p>
      </LessonSection>

      <LessonSection title="Lytt til helheten, så til rundgang">
        <p>
          Når hver kanal er satt, la bandet spille et vers sammen og lytt til helheten: hører du
          ordene? Er det noe som stikker seg ut eller forsvinner? Juster forsiktig. Sett så
          monitorene for musikerne, og let bevisst etter rundgang mens det er rolig — det er mye
          bedre å finne den nå enn midt i lovsangen.
        </p>
      </LessonSection>

      <LessonSection title="Lagre scenen">
        <p>
          De fleste digitale bord kan lagre en «scene» — hele oppsettet med alle nivåer. Lagre når
          du er fornøyd, og gi den et navn (for eksempel «Søndag formiddag»). Neste gang starter du
          ikke på null: du henter scenen, gjør små justeringer for dagens band, og er ferdig på
          minutter. Lag gjerne egne scener for ulike oppsett — dåp, konsert, vanlig gudstjeneste.
        </p>
      </LessonSection>

      <LessonSection title="Snakk med musikerne">
        <p>
          Til slutt: det viktigste verktøyet ditt er en vennlig avtale med dem på scenen. Bli enige
          om enkle håndtegn — tommel opp for «mer meg», flat hånd ned for «litt mindre». Si fra når
          du er klar, og spør om de hører seg selv. En trygg musiker som hører seg selv godt,
          spiller bedre — og da blir lyden i salen bedre helt av seg selv.
        </p>
        <p>
          Vil du friske opp pulten, er den bare et klikk unna:{' '}
          <Link href="/lydteknikk/miksepult" className="underline" style={{ color: 'var(--fag)' }}>
            åpne miksepulten
          </Link>{' '}
          og øv i fred før søndag.
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
      fag="var(--fag-lydteknikk)"
      back={{ href: '/lydteknikk', label: 'Lydteknikk' }}
      kicker="Lydteknikk · Leksjon"
      icon={SlidersHorizontal}
      finalCta={{ href: '/lydteknikk/miksepult', label: 'Åpne miksepulten' }}
      prev={prev && { href: `/lydteknikk/${prev.slug}`, label: prev.title }}
      next={next && { href: `/lydteknikk/${next.slug}`, label: next.title }}
    >
      {body()}
      <LessonComplete slug={leksjon} />
    </LessonShell>
  )
}
