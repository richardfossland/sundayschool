import type { CatechismSection } from '@/types/teologi'

// ── Luthers lille katekisme ────────────────────────────────────────────────────
// The five chief parts of Luther's Small Catechism (1529) in the classic
// Norwegian wording tradition, with the orthography gently modernised by us
// (mig→meg, eder→dere-forms etc.) — hence `modernized: true` in rights. The
// Q/A structure doubles as read-mode and quiz-mode (QuizToggle). Text kept
// close to the traditional formulations; nothing doctrinal is paraphrased.

const RIGHTS = {
  source: 'Luthers lille katekisme (1529); norsk klassisk utgave-tradisjon',
  modernized: true,
} as const

export const catechismSections: CatechismSection[] = [
  {
    id: 'budene',
    part: 1,
    title: 'De ti bud',
    intro:
      'Det første hovedstykket: Guds ti bud, slik en husfar enkelt skal lære sine husfolk dem — hvert bud med Luthers forklaring på spørsmålet «Hva er det?».',
    items: [
      {
        q: 'Det første budet: Du skal ikke ha andre guder enn meg. — Hva er det?',
        a: 'Vi skal frykte og elske Gud over alle ting og sette all vår lit til ham.',
      },
      {
        q: 'Det andre budet: Du skal ikke misbruke Herrens, din Guds navn. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi ikke banner, sverger, gjør trolldom, lyver eller bedrar ved hans navn, men kaller på ham i all nød, ber, lover og takker.',
      },
      {
        q: 'Det tredje budet: Du skal holde hviledagen hellig. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi ikke forakter forkynnelsen og Guds ord, men holder det hellig, gjerne hører og lærer det.',
      },
      {
        q: 'Det fjerde budet: Du skal hedre din far og din mor. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi ikke forakter våre foreldre og foresatte eller vekker deres vrede, men holder dem i ære, tjener, lyder, elsker og akter dem.',
      },
      {
        q: 'Det femte budet: Du skal ikke slå i hjel. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi ikke skader vår neste på hans legeme eller gjør ham noe ondt, men hjelper og støtter ham i all legemlig nød.',
      },
      {
        q: 'Det sjette budet: Du skal ikke bryte ekteskapet. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi lever rent og sømmelig i ord og gjerninger, og enhver elsker og ærer sin ektefelle.',
      },
      {
        q: 'Det sjuende budet: Du skal ikke stjele. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi ikke tar vår nestes penger eller eiendom eller tilvender oss det ved falske varer eller annen urett, men hjelper ham å bevare det han eier, og å bedre sine kår.',
      },
      {
        q: 'Det åttende budet: Du skal ikke si falskt vitnesbyrd mot din neste. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi ikke lyver på vår neste, ikke sviker eller baktaler ham eller fører ondt rykte over ham, men unnskylder ham, taler vel om ham og tar alt opp i beste mening.',
      },
      {
        q: 'Det niende budet: Du skal ikke begjære din nestes hus. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi ikke med list trakter etter vår nestes arv eller hus eller tilegner oss det med skinn av rett, men hjelper ham og står ham bi, så han kan beholde sitt.',
      },
      {
        q: 'Det tiende budet: Du skal ikke begjære noe som hører din neste til. — Hva er det?',
        a: 'Vi skal frykte og elske Gud, så vi ikke lokker eller truer fra vår neste hans ektefelle eller hans folk, men formaner dem til å bli og gjøre sin plikt.',
      },
    ],
    rights: RIGHTS,
  },
  {
    id: 'troen',
    part: 2,
    title: 'Trosartiklene',
    intro:
      'Det andre hovedstykket: den apostoliske trosbekjennelsens tre artikler — om skapelsen, forløsningen og helliggjørelsen — hver med Luthers forklaring.',
    items: [
      {
        q: 'Den første artikkel — om skapelsen: Jeg tror på Gud Fader, den allmektige, himmelens og jordens skaper. — Hva er det?',
        a: 'Jeg tror at Gud har skapt meg og alle andre skapninger, og gitt meg legeme og sjel, øyne, ører og alle lemmer, fornuft og alle sanser, og at han fremdeles holder dette ved lag. Han gir meg klær og sko, mat og drikke, hus og hjem og alt jeg trenger til livets opphold; han verger meg mot all fare og vokter og bevarer meg mot alt ondt. Alt dette gjør han av faderlig og guddommelig godhet og barmhjertighet, uten at jeg har fortjent det eller er verdig til det. For alt dette skylder jeg å takke og love ham, tjene og lyde ham. Det er visst og sant.',
      },
      {
        q: 'Den andre artikkel — om forløsningen: Jeg tror på Jesus Kristus, Guds enbårne Sønn, vår Herre. — Hva er det?',
        a: 'Jeg tror at Jesus Kristus, sann Gud, født av Faderen fra evighet, og sant menneske, født av jomfru Maria, er min Herre, som har gjenløst meg fortapte og fordømte menneske, kjøpt meg fri og frelst meg fra alle synder, fra døden og fra djevelens makt, ikke med gull eller sølv, men med sitt hellige, dyrebare blod og sin uskyldige lidelse og død, for at jeg skal være hans egen og leve under ham i hans rike og tjene ham i evig rettferdighet, uskyldighet og salighet, likesom han er oppstanden fra de døde, lever og regjerer i evighet. Det er visst og sant.',
      },
      {
        q: 'Den tredje artikkel — om helliggjørelsen: Jeg tror på Den Hellige Ånd. — Hva er det?',
        a: 'Jeg tror at jeg ikke av egen fornuft eller kraft kan tro på Jesus Kristus, min Herre, eller komme til ham. Men Den Hellige Ånd har kalt meg ved evangeliet, opplyst meg med sine gaver, helliggjort meg og holdt meg fast i den sanne tro, likesom han kaller, samler, opplyser og helliggjør hele den kristne kirke på jorden og bevarer den hos Jesus Kristus i den ene sanne tro. I denne kristne kirke forlater han daglig meg og alle troende all synd, og skal på den ytterste dag vekke opp meg og alle døde og gi meg og alle troende i Kristus et evig liv. Det er visst og sant.',
      },
    ],
    rights: RIGHTS,
  },
  {
    id: 'fadervar',
    part: 3,
    title: 'Fadervår',
    intro:
      'Det tredje hovedstykket: Herrens bønn — innledningen, de sju bønnene og avslutningen, hver med Luthers forklaring.',
    items: [
      {
        q: 'Innledningen: Fader vår, du som er i himmelen! — Hva er det?',
        a: 'Gud vil med dette vennlig lokke oss til å tro at han er vår rette Far og vi hans rette barn, så vi trygt og tillitsfullt kan be til ham, slik kjære barn ber sin kjære far.',
      },
      {
        q: 'Den første bønnen: Helliget vorde ditt navn. — Hva er det?',
        a: 'Guds navn er nok hellig i seg selv, men vi ber i denne bønnen at det også må bli hellig hos oss. Det skjer når Guds ord læres klart og rent, og vi som Guds barn også lever hellig etter det.',
      },
      {
        q: 'Den andre bønnen: Komme ditt rike. — Hva er det?',
        a: 'Guds rike kommer nok av seg selv, uten vår bønn, men vi ber i denne bønnen at det også må komme til oss. Det skjer når vår himmelske Far gir oss sin Hellige Ånd, så vi ved hans nåde tror hans hellige ord og lever gudfryktig, her i tiden og siden i evigheten.',
      },
      {
        q: 'Den tredje bønnen: Skje din vilje, som i himmelen, så og på jorden. — Hva er det?',
        a: 'Guds gode og nådige vilje skjer nok uten vår bønn, men vi ber i denne bønnen at den også må skje hos oss. Det skjer når Gud gjør hvert ondt råd og hver ond vilje til intet som ikke vil la oss hellige Guds navn og hindrer hans rike i å komme, og når han styrker oss og holder oss fast i sitt ord og i troen inntil vår ende. Dette er hans gode og nådige vilje.',
      },
      {
        q: 'Den fjerde bønnen: Gi oss i dag vårt daglige brød. — Hva er det?',
        a: 'Gud gir nok daglig brød til alle mennesker, også de onde, uten vår bønn, men vi ber i denne bønnen at han vil la oss skjønne det, så vi tar imot vårt daglige brød med takk. Daglig brød er alt det som trengs til livets opphold: mat og drikke, klær og sko, hus og hjem, arbeid og helse, gode venner og trofaste naboer og annet slikt.',
      },
      {
        q: 'Den femte bønnen: Forlat oss vår skyld, som vi og forlater våre skyldnere. — Hva er det?',
        a: 'Vi ber i denne bønnen at vår Far i himmelen ikke vil se på våre synder og ikke for deres skyld avvise våre bønner. For vi er ikke verdige til noe av det vi ber om og har heller ikke fortjent det, men vi ber at han vil gi oss alt av nåde. Så vil vi også selv av hjertet tilgi og gjerne gjøre godt mot dem som synder mot oss.',
      },
      {
        q: 'Den sjette bønnen: Led oss ikke inn i fristelse. — Hva er det?',
        a: 'Gud frister ingen, men vi ber i denne bønnen at Gud vil vokte og bevare oss, så djevelen, verden og vårt eget kjød ikke skal bedra oss og forføre oss til vantro, fortvilelse og annen stor skam og last, og at vi, når vi blir angrepet, til sist må vinne og beholde seieren.',
      },
      {
        q: 'Den sjuende bønnen: Men fri oss fra det onde. — Hva er det?',
        a: 'Vi ber i denne bønnen, som i en sum, at vår Far i himmelen vil fri oss fra alt ondt på legeme og sjel, eiendom og ære, og til sist, når vår time kommer, gi oss en salig død og i nåde ta oss fra denne sorgens dal hjem til seg i himmelen.',
      },
      {
        q: 'Avslutningen: For riket er ditt, og makten og æren i evighet. Amen. — Hva betyr Amen?',
        a: 'Amen vil si: Ja, det skal skje slik. Vi skal være visse på at slike bønner er til behag for vår Far i himmelen og blir hørt av ham, for han har selv befalt oss å be slik, og lovt at han vil høre oss.',
      },
    ],
    rights: RIGHTS,
  },
  {
    id: 'dapen',
    part: 4,
    title: 'Dåpen',
    intro: 'Det fjerde hovedstykket: den hellige dåps sakrament, i fire spørsmål og svar.',
    items: [
      {
        q: 'Hva er dåpen?',
        a: 'Dåpen er ikke bare vann, men vann som er innesluttet i Guds befaling og forbundet med Guds ord.',
      },
      {
        q: 'Hva gir eller gagner dåpen?',
        a: 'Den virker syndenes forlatelse, frir fra døden og djevelen og gir den evige salighet til alle som tror det, slik Guds ord og løfte lyder.',
      },
      {
        q: 'Hvordan kan vann gjøre så store ting?',
        a: 'Vann gjør det visselig ikke, men Guds ord som er med og hos vannet, og troen som stoler på dette Guds ord i vannet. For uten Guds ord er vannet bare vann og ingen dåp, men med Guds ord er det en dåp, det vil si et nåderikt livets vann og et bad til gjenfødelse i Den Hellige Ånd.',
      },
      {
        q: 'Hva betyr det å bli døpt med vann?',
        a: 'Det betyr at det gamle mennesket i oss skal druknes ved daglig anger og bot og dø med alle synder og onde lyster, og at et nytt menneske daglig skal stige frem og oppstå, som skal leve evig for Gud i rettferdighet og renhet.',
      },
    ],
    rights: RIGHTS,
  },
  {
    id: 'nattverden',
    part: 5,
    title: 'Nattverden',
    intro: 'Det femte hovedstykket: alterets sakrament, i fire spørsmål og svar.',
    items: [
      {
        q: 'Hva er alterets sakrament?',
        a: 'Det er vår Herre Jesu Kristi sanne legeme og blod, under brødet og vinen, gitt oss kristne å ete og drikke, innstiftet av Kristus selv.',
      },
      {
        q: 'Hva gagner det å ete og drikke slik?',
        a: 'Det viser oss disse ordene: «gitt for dere» og «utøst for dere til syndenes forlatelse» — nemlig at syndenes forlatelse, liv og salighet gis oss i sakramentet ved disse ordene. For der syndenes forlatelse er, der er også liv og salighet.',
      },
      {
        q: 'Hvordan kan det å ete og drikke legemlig gjøre så store ting?',
        a: 'Å ete og drikke gjør det visselig ikke, men ordene: «gitt for dere» og «utøst for dere til syndenes forlatelse». Disse ordene er, sammen med det legemlige å ete og drikke, hovedsaken i sakramentet. Den som tror disse ordene, har det de sier, nemlig syndenes forlatelse.',
      },
      {
        q: 'Hvem tar verdig imot dette sakramentet?',
        a: 'Å faste og berede seg legemlig er nok en god ytre skikk, men rett verdig og vel skikket er den som tror disse ordene: «gitt for dere» og «utøst for dere til syndenes forlatelse». Den som ikke tror disse ordene eller tviler, er uverdig og uskikket, for ordet «for dere» krever hjerter som tror.',
      },
    ],
    rights: RIGHTS,
  },
]
