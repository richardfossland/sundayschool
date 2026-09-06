import type { HymnStory } from '@/types/teologi'

// ── Salmehistorier ─────────────────────────────────────────────────────────────
// One editorial article per WORK (see src/data/songs). Norwegian bokmål,
// 300–600 words each, markdown-lite (blank-line paragraphs, '### ' subheadings).
// Facts are held to what is well established in standard hymnody literature
// (Julian's Dictionary of Hymnology 1892; Skaar's Norsk Salmehistorie 1879–80,
// and the songs' own rights sources); uncertain details are left out or flagged.
//
// Variants (enkel/firstemmig/gospel of the same work) share the work's article:
// HymnStoryLink falls back from the song's slug to its work_slug, so generated
// arrangements never need their own story here.
//
// DECISION — «Amazing Grace (firstemmig)» (slug amazing-grace-firstemmig)
// predates the work/variant model and keeps its own entry: the SAME body
// (AMAZING_GRACE_BODY) with a short arrangement note appended.

const AMAZING_GRACE_BODY = `John Newton visste hva han skrev om da han satte ord på nåde. Han ble født i London i 1725, gikk tidlig til sjøs, og havnet etter hvert i slavehandelen — først som mannskap, siden som kaptein på skip som fraktet slavebundne mennesker over Atlanteren. Det var ikke en from ungdom som skrev «Amazing Grace»; det var en mann som langsomt måtte se tilbake på sitt eget liv med gru.

### Stormen som snudde

Vendepunktet kom natten til 10. mars 1748. Skipet Greyhound ble fanget i en voldsom storm på vei hjem, og Newton, som hadde spottet all tro, ropte for første gang til Gud om nåde. Skipet holdt, og Newton regnet siden den natten som begynnelsen på sin omvendelse. Forandringen kom likevel ikke over natten — han fortsatte en tid i slavehandelen — men gradvis vokste en overbevisning som til slutt gjorde ham til prest i Den engelske kirke og til en åpen motstander av slaveriet han selv hadde levd av.

### En preken som ble en salme

Teksten ble skrevet til nyttårsdag 1773, da Newton var prest i den lille byen Olney. Den fulgte en preken over 1. Krønikebok 17, der kong David undrer seg over at Gud har ført ham så langt. «Amazing grace, how sweet the sound, that saved a wretch like me» — ordet «wretch», en elendig stakkar, er ikke poetisk overdrivelse hos Newton. Det er en selvbeskrivelse.

Salmen ble trykt i Olney Hymns (1779), samlingen Newton ga ut sammen med dikteren William Cowper. Melodien vi synger i dag, NEW BRITAIN, er derimot amerikansk og dukket først opp i notesamlingen Southern Harmony (1835). Tekst og tone fant altså ikke hverandre før lenge etter Newtons død i 1807.

### Hvorfor den lever videre

Få salmer har reist så langt utenfor kirkens vegger som denne. Den handler ikke om den frommes fortjeneste, men om nåden som møter mennesket akkurat der det er — «I once was lost, but now am found, was blind, but now I see». For en menighet er «Amazing Grace» en påminnelse om at ingen fortid er for mørk til å nås av nåden. Newtons gravskrift, som han skrev selv, sier det kort: en gang en vantro og utsvevende mann, en tjener i slavehandelen, ble ved Guds rike nåde bevart, gjenopprettet og benådet.`

const AMAZING_GRACE: HymnStory = {
  songSlug: 'amazing-grace',
  title: 'Amazing Grace — nåden som fant en slavehandler',
  bodyMd: AMAZING_GRACE_BODY,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'John Newton, Olney Hymns (1779)',
    'Southern Harmony (1835)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); Newton, Olney Hymns (1779)',
  },
}

const AMAZING_GRACE_FIRSTEMMIG: HymnStory = {
  songSlug: 'amazing-grace-firstemmig',
  title: 'Amazing Grace — nåden som fant en slavehandler',
  bodyMd: `${AMAZING_GRACE_BODY}

### Om denne satsen

Dette er samme salme som «Amazing Grace», men i en fyldigere firstemmig sats. Historien bak teksten og melodien er den samme — se den fullstendige artikkelen over.`,
  sources: AMAZING_GRACE.sources,
  rights: AMAZING_GRACE.rights,
}

const GLADE_JUL: HymnStory = {
  songSlug: 'glade-jul',
  title: 'Glade jul — julenatten i Oberndorf',
  bodyMd: `Ingen salme sier «jul» tydeligere over hele verden enn «Stille Nacht» — hos oss «Glade jul». At den er blitt selve julens melodi, er desto merkeligere når man vet hvor beskjedent den begynte.

### En kveld i Oberndorf, 1818

Scenen er den lille alpelandsbyen Oberndorf ved Salzburg i Østerrike, julaften 1818. Den unge hjelpepresten Joseph Mohr hadde alt året før skrevet en diktstrofe med tittelen «Stille Nacht, heilige Nacht». På selve julaften ba han organisten og læreren Franz Gruber sette tone til ordene, slik at de kunne synges under midnattsmessen. Gruber skrev en enkel, vuggende melodi for to stemmer og gitar, og samme kveld ble salmen fremført for første gang i kirken St. Nikolaus.

At den ble tenkt for gitar og ikke orgel, hører til de gode historiene rundt salmen. Uansett detaljene ble resultatet en sang med en mildhet som passet natten den ble skrevet til.

### Fra dal til verden

Melodien spredte seg langsomt ut av dalen, ført videre av omreisende sangere og orgelbyggere. I løpet av 1800-tallet ble den oversatt til det ene språket etter det andre, og i dag synges den på over hundre språk. Den norske teksten «Glade jul, hellige jul» er en gjendiktning ved presten og salmedikteren Wilhelm Andreas Wexels fra 1800-tallet — ikke en direkte oversettelse, men en fri norsk form som har fått sitt eget liv i våre kirker og hjem.

### Hvorfor den varer

Der mange julesanger fylles av glans og bevegelse, dveler «Glade jul» ved stillheten. Den maner ikke frem juletravelheten, men bildet av barnet i krybben og natten som holder pusten. Nettopp roen har gjort den til en salme som samler — den synges like naturlig i katedralen som ved sengekanten. Historien om at den ble til på en enkelt kveld, med bare en gitar til hjelp, har fulgt salmen som en del av dens sjarm: det største kan begynne i det minste.`,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'Stille Nacht Gesellschaft, Oberndorf',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); Skaar, Norsk Salmehistorie (1879–80)',
  },
}

const JOYFUL_JOYFUL: HymnStory = {
  songSlug: 'joyful-joyful',
  title: 'Joyful, Joyful — Beethovens glede blir salme',
  bodyMd: `«Joyful, Joyful, We Adore Thee» er et av de klareste eksemplene på at kirken og konsertsalen kan låne av hverandre. Melodien er kjent av langt flere enn dem som noen gang har sunget salmen: det er «Hymn to Joy», hentet fra finalen i Ludvig van Beethovens niende symfoni.

### Ode til glede

Beethoven fullførte sin niende symfoni i 1824. I den siste satsen gjorde han noe uhørt for sin tid: han lot et kor synge, over ord fra Friedrich Schillers dikt «An die Freude» — «Ode til gleden». Selv var Beethoven da nesten fullstendig døv. Den brede, oppadstigende melodien som bærer Schillers ord om menneskehetens brorskap, ble en av de mest gjenkjennelige i vestlig musikk.

### Teksten kommer til

Salmeteksten er langt yngre enn melodien. Den ble skrevet av den amerikanske presten og forfatteren Henry van Dyke tidlig på 1900-tallet. Van Dyke skal ha diktet ordene mens han var gjest i fjellene i Massachusetts, med utsikten for øyne, og ønsket seg uttrykkelig at de skulle synges til Beethovens melodi. Slik ble Schillers verdslige lovsang til gleden løftet inn i en kristen ramme: gleden retter seg nå mot Gud som skaper, «Herre over alt som er».

### En lovsang i vid forstand

Teksten er full av naturens vitnesbyrd — blomstene, stjernene, den syngende fuglen — og lar hele skaperverket stemme i med mennesket i tilbedelse. Det gir salmen en romslig, nesten jublende tone som passer melodien den ble skrevet for. I gudstjenesten fungerer den godt som åpningssalme eller ved store fester, der en menighet trenger noe å løfte stemmen med. At tonene opprinnelig sprang ut av en døv komponists tro på gleden som samler menneskene, gir salmen et ekstra lag av mening.`,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'Henry van Dyke, Poems (samlede utgaver)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); alminnelig salmehistorisk litteratur',
  },
}

const KIRKEN_DEN_ER: HymnStory = {
  songSlug: 'kirken-den-er-et-gammelt-hus',
  title: 'Kirken den er et gammelt hus — Grundtvig og Lindeman',
  bodyMd: `«Kirken den er et gammelt hus» er en av de mest folkekjære salmene i den nordiske kirken, og et mønstereksempel på det tette samarbeidet mellom dansk tekst og norsk tone som preget 1800-tallets salmesang.

### Grundtvig og kirkebildet

Teksten er skrevet av dansken Nikolai Frederik Severin Grundtvig, prest, dikter og en av Nordens mest innflytelsesrike kirkelige skikkelser på 1800-tallet. Grundtvig var opptatt av at kirken ikke først og fremst er bygningen av stein, men det levende fellesskapet av troende. Nettopp den tanken bærer salmen: «Kirken den er et gammelt hus, står om enn tårnene falle» — selv om murene forfaller, står kirken, for den er noe mer enn mur og tårn.

Bilde etter bilde fører teksten oss fra det synlige huset til det usynlige: Gud bygger seg ikke bolig i hus av stein, men i menneskenes hjerter. For Grundtvig var dette selve kjernen — kirken er der Ordet lyder og menigheten samles, enten det skjer i en katedral eller i en fattig stue.

### Lindemans tone

Melodien vi synger, er komponert av Ludvig Mathias Lindeman, den store norske organisten og koralsamleren. Lindeman viet livet til å samle inn og bevare norske folketoner og til å skape et solid koralrepertoar for Den norske kirke. Hans melodi til Grundtvigs tekst er enkel og trygg å synge, med en ro som passer ordenes innhold. I Norge er teksten kjent i Magnus Brostrup Landstads form, gjennom Landstads salmebok.

### En salme for hverdag og fest

Salmen brukes gjerne ved kirkevigsler og jubileer, men den hører like godt hjemme i den vanlige gudstjenesten. Den minner menigheten om at det varige ikke er byggverket, men fellesskapet og troen som samles der. For barn har den dessuten et vennlig, konkret bilde å holde fast ved: kirken som et gammelt, trygt hus der man alltid hører hjemme.`,
  sources: [
    'Hans Skaar, Norsk Salmehistorie (1879–80)',
    'Landstads salmebok',
    'Lindemans koralbok (1877)',
  ],
  rights: {
    source: 'Egen tekst; kilder: Skaar, Norsk Salmehistorie (1879–80); Landstads salmebok',
  },
}

const PASKEMORGEN: HymnStory = {
  songSlug: 'paskemorgen',
  title: 'Påskemorgen slukker sorgen — Grundtvigs oppstandelsessalme',
  bodyMd: `«Påskemorgen slukker sorgen» er blant de sterkeste påskesalmene i den nordiske tradisjonen. Den fører oss rett inn i det som er påskens innerste: budskapet om at døden er overvunnet.

### Sorgen som slukkes

Teksten er skrevet av Nikolai Frederik Severin Grundtvig, den danske presten og dikteren som satte et så dypt preg på salmesangen i hele Norden. Allerede første linje slår an hele salmens bevegelse: «Påskemorgen slukker sorgen, slukker sorgen til evig tid.» Det er en salme som ikke stanser ved gravens mørke, men ved lyset som bryter frem på oppstandelsesmorgenen.

Grundtvig lar salmen følge de sørgende kvinnene til graven i påskehagen. De kommer med gråt og salve, men møter en åpen grav og et budskap som snur alt: han er ikke her, han er oppstanden. Sorgen er ikke fornektet — den er tatt på alvor — men den får ikke siste ord. Oppstandelsen slukker den.

### Lindemans melodi

Tonen er komponert av Ludvig Mathias Lindeman, organisten og koralsamleren som formet så mye av den norske kirkesangen på 1800-tallet. Melodien har en lys, oppadstrebende karakter som svarer til tekstens innhold: den løfter menigheten fra klage til jubel. Sammen utgjør Grundtvigs ord og Lindemans tone en salme som mange norske menigheter opplever som selve lyden av påskemorgen.

### Påskens midtpunkt

I gudstjenesten hører salmen naturlig hjemme på påskedag, gjerne som inngang til høymessen når mørket fra langfredag skal vike for oppstandelsens glede. Den lærer noe grunnleggende om kristen tro: håpet står ikke og faller med at alt er lyst her og nå, men hviler på at graven ble funnet tom. For den som bærer på sorg, sier salmen at sorgen ikke er det siste — påskemorgenen har slukket den til evig tid.`,
  sources: ['Hans Skaar, Norsk Salmehistorie (1879–80)', 'Lindemans koralbok (1877)'],
  rights: {
    source: 'Egen tekst; kilder: Skaar, Norsk Salmehistorie (1879–80); Lindemans koralbok (1877)',
  },
}

const WHAT_A_FRIEND: HymnStory = {
  songSlug: 'what-a-friend',
  title: 'What a Friend We Have in Jesus — trøst født av sorg',
  bodyMd: `Bak den milde, fortrøstningsfulle salmen «What a Friend We Have in Jesus» — «Hvilken venn vi har i Jesus» — ligger et liv preget av tap. Den som skrev ordene, Joseph Scriven, kjente selv til sorgen han skrev inn i trøst.

### Et liv merket av tap

Joseph Scriven ble født i Irland i 1819. Ifølge den mest utbredte fortellingen skulle han gifte seg, men kvelden før bryllupet druknet hans forlovede. Knust av sorg forlot han Irland og emigrerte til Canada. Også der ble han rammet: en ny forlovede ble syk og døde før de rakk å gifte seg. Scriven levde resten av livet enkelt og tilbaketrukket i Canada, kjent for å hjelpe fattige og syke uten å be om noe igjen.

### En trøst sendt over havet

Salmens ord ble ikke skrevet for å synges av en menighet. Rundt 1855 skal Scriven ha satt dem på papiret som en trøst til sin egen mor, som var syk i Irland mens han selv var langt borte i Canada. Det var et personlig brev i versform, ikke en salme tenkt for kirken. At en fremmed senere kom over diktet og gjenkjente hvem som hadde skrevet det, skal ha overrasket Scriven selv — han sa gjerne at «Herren og jeg gjorde det sammen».

Nettopp fordi ordene sprang ut av virkelig nød, treffer de. «Alle våre sorger bære, alt til Jesus tar vi frem» — det er ikke en teori om lidelse, men erfaringen til en mann som selv hadde måttet bære tungt.

### Melodien og bruken

Melodien vi synger, ble skrevet av den amerikanske komponisten Charles Crozat Converse noen år senere, og det var i denne formen salmen for alvor bredte seg utover i verden. I dag hører den hjemme både i store gudstjenester og i stille stunder ved sykesengen. Budskapet er enkelt og bærende: vi har en venn i Jesus som vi kan komme til med alt, i bønn. For mange er nettopp denne salmen blitt en følgesvenn i livets tyngste dager — slik den en gang var det for Scrivens syke mor.`,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'Alminnelig salmehistorisk overlevering om Joseph Scriven',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); salmehistorisk overlevering',
  },
}

const SWING_LOW: HymnStory = {
  songSlug: 'swing-low',
  title: 'Swing Low, Sweet Chariot — vognen som skal hente hjem',
  bodyMd: `«Swing Low, Sweet Chariot» er en av de mest kjente afroamerikanske spirituals — sangene som ble til blant slavebundne mennesker i det amerikanske Sør. Bak den vuggende, trøstefulle melodien ligger et rikt lag av bibelbilder og en lengsel etter frihet.

### En sang fra slaveriets tid

Spirituals oppsto blant slavebundne afroamerikanere på 1800-tallet, ofte i grenselandet mellom det religiøse og det høyst konkrete. «Swing Low» knyttes tradisjonelt til Wallis Willis, en mann av choctaw-tilknytning som levde i det som i dag er Oklahoma, en tid før borgerkrigen. Bildet i sangen — en vogn som svinger ned fra himmelen for å bære den troende hjem — er hentet rett fra Bibelen: profeten Elia som blir tatt opp til himmelen i en ildvogn (2. Kongebok 2).

For dem som først sang den, hadde «hjem» flere betydninger på én gang: himmelen og hvilen hos Gud, men også, for mange, håpet om frihet nordover, bort fra slaveriet. Slik bærer sangen både en åndelig og en jordisk lengsel i samme bilde.

### Fisk Jubilee Singers

Sangen ble kjent langt utover Sørstatene gjennom Fisk Jubilee Singers, et kor av unge afroamerikanske sangere fra Fisk University i Tennessee. Fra 1870-tallet reiste de rundt og fremførte spirituals for et bredt publikum, og gjennom dem ble sanger som «Swing Low» bevart, skrevet ned og båret ut i verden. Uten dette arbeidet ville mye av denne musikkarven vært tapt.

### En trøstesang som varer

Melodien er rolig og bærende, lett å synge og lett å bli med på. Den taler til alle som lengter etter hvile og hjemkomst, og har derfor beholdt sin plass både i kirkens repertoar og langt utenfor det. Å synge den er også å minnes menneskene den kom fra: en tro som holdt oppe midt i undertrykkelse, og et håp som pekte forbi lidelsen mot en frihet som ikke kunne tas fra dem.`,
  sources: [
    'Jubilee Songs / Fisk Jubilee Singers (1872)',
    'Alminnelig litteratur om afroamerikanske spirituals',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Fisk Jubilee Singers-tradisjonen (1872); alminnelig litteratur om spirituals',
    notes:
      'Opphavet til enkeltdetaljer i spirituals er ofte usikkert; artikkelen holder seg til den mest utbredte overleveringen.',
  },
}

const WHEN_THE_SAINTS: HymnStory = {
  songSlug: 'when-the-saints',
  title: 'When the Saints Go Marching In — fra gravferd til jubel',
  bodyMd: `Få sanger reiser seg fra så alvorlig et opphav til så stor livsglede som «When the Saints Go Marching In». I dag kjenner mange den som en munter jazzmelodi, men røttene ligger i den afroamerikanske kirkesangen og i New Orleans' særegne begravelsestradisjon.

### Et bilde fra Åpenbaringen

Teksten bygger på synet av de hellige som samles hos Gud ved tidens ende — bilder hentet fra Johannes' åpenbaring, der de frelste marsjerer inn i den himmelske staden. «Oh, when the saints go marching in, Lord, how I want to be in that number» — sangeren ber om selv å få være blant dem som går inn. Det er altså en oppstandelses- og håpssang, en bønn om å høre til blant Guds folk når alt en gang skal fullendes.

### Gjennom New Orleans

Sangen vokste frem i det afroamerikanske kirkelivet på slutten av 1800-tallet og begynnelsen av 1900-tallet. I New Orleans fikk den en helt egen plass i byens «jazz funerals»: et gravfølge kunne gå til graven med langsom, sørgmodig musikk, for så — når den døde var lagt til hvile — å vende tilbake med oppløftende, dansende toner. «When the Saints» ble en av de sangene som markerte nettopp dette vendepunktet, fra sorg til feiring av at den døde nå var hos Gud.

Gjennom jazzmusikere i New Orleans, ikke minst Louis Armstrongs berømte innspilling, ble melodien kjent over hele verden og et symbol på byen selv.

### Sorg og glede i samme sang

Nettopp denne dobbeltheten gjør sangen så sterk. Den er født i møtet med døden, men peker forbi den mot oppstandelsens glede. Å synge den er å holde fast ved håpet om at de som er gått bort, ikke er borte for alltid, men er «i that number» — blant de hellige som marsjerer inn til Gud. Derfor kan den både trøste ved en gravferd og løfte taket i en jublende gudstjeneste.`,
  sources: [
    'Alminnelig litteratur om gospel og New Orleans-tradisjonen',
    'Johannes’ åpenbaring (bibelsk bakgrunn)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: alminnelig litteratur om gospel- og New Orleans-tradisjonen',
    notes:
      'Sangens tidligste opphav er ikke sikkert dokumentert; artikkelen bygger på den bredt aksepterte tradisjonen.',
  },
}

const KUMBAYA: HymnStory = {
  songSlug: 'kumbaya',
  title: 'Kum ba yah — «kom hit, Herre»',
  bodyMd: `«Kum ba yah» er blitt sunget rundt utallige leirbål og i utallige barnesamlinger, så mye at mange knapt tenker på den som en salme. Men bønnen som ligger i den, er så enkel og direkte som en bønn kan bli.

### «Come by here»

Selve tittelen regnes vanligvis som en sammentrekning av det engelske «Come by here» — «kom hit». Sangen antas å ha oppstått blant afroamerikanske kristne i det amerikanske Sør, muligens knyttet til gullah-samfunnene langs kysten av South Carolina og Georgia, der en kreolsk engelsk ble talt. Hvert vers er en bønn om Guds nærvær i en konkret situasjon: «Someone's crying, Lord» — «noen gråter, Herre, kom hit»; «someone's praying» — «noen ber». Bønnen er hele tiden den samme: kom hit, vær nær.

### Fra kysten til hele verden

Sangen ble skrevet ned og samlet inn tidlig på 1900-tallet, og bredte seg gjennom det brede folkemusikk- og vekkelsesmiljøet. Fra midten av århundret ble den enormt utbredt i speiderbevegelsen, i søndagsskoler og i kristne ungdomsleirer over hele verden. Nettopp fordi den er så lett å lære — få ord, en rolig melodi, og vers som lar seg fylle med det den enkelte bærer på — ble den en av de mest sungne sangene i sitt slag.

### En bønn alle kan be

At sangen er blitt så folkelig, har noen ganget gjort at den blir tatt lett på. Men innholdet er dypt alvorlig: den ber Gud komme nær nettopp der mennesker gråter, ber og trenger ham. Det gjør den til en fin sang å bruke i bønn med barn og unge, der hvert vers kan settes til ord for det man selv vil be om. Bak den enkle formen ligger troen på at Gud faktisk hører, og at han kommer — «kum ba yah, my Lord, kom hit».`,
  sources: [
    'Alminnelig litteratur om afroamerikansk og gullah-tradisjon',
    'Folkemusikksamlinger fra tidlig 1900-tall',
  ],
  rights: {
    source:
      'Egen tekst; kilder: alminnelig litteratur om afroamerikansk sang- og gullah-tradisjon',
    notes:
      'Sangens presise opphav er omdiskutert; artikkelen gjengir den mest utbredte forståelsen.',
  },
}

const JOY_TO_THE_WORLD: HymnStory = {
  songSlug: 'joy-to-the-world',
  title: 'Joy to the World — julesangen som ikke handler om julenatt',
  bodyMd: `«Joy to the World» er en av verdens mest sungne julesanger — og den nevner verken Betlehem, hyrder eller en krybbe. Teksten er nemlig ikke skrevet som julesang i det hele tatt. Isaac Watts ga den ut i 1719 i samlingen The Psalms of David Imitated, der han gjendiktet Davids salmer i lys av Kristus. «Joy to the World» er hans gjendiktning av siste del av Salme 98: «Rop med jubel for Herren, hele jorden! … for han kommer for å dømme jorden.»

### Dikteren som fornyet menighetssangen

Isaac Watts (1674–1748) regnes som den engelske hymnodiens far. Som ung klaget han over de tunge, ordrette salmeoversettelsene i sin fars menighet — og fikk til svar at han fikk skrive noe bedre selv. Det gjorde han: rundt 600 salmer, deriblant «When I Survey the Wondrous Cross». Watts ville at menigheten skulle synge Skriften med sitt eget språk og sitt eget hjerte, og i «Joy to the World» lot han Salme 98 peke framover mot Kongen som kommer — derfor passer den både til advent, jul og Kristi kongedag.

### Melodien med Händel-klang

Melodien ANTIOCH dukket opp i den amerikanske notesamlingen The Modern Psalmist (1839), redigert av Lowell Mason, med påskriften «from Handel». Åpningen — en ren fallende durskala — minner om vendinger i Händels Messias, og på 1800-tallet ble melodien gjerne tilskrevet ham. Forskningen regner i dag melodien i hovedsak som Masons eget arbeid på hendelsk grunn; nøyaktig hvor mye som er lån og hvor mye som er Mason, er fortsatt omdiskutert. Mason (1792–1872) var uansett rett mann: som kirkemusiker og musikkpedagog i Boston formet han amerikansk menighetssang mer enn noen annen i sin samtid.

### Hvorfor den lever videre

Sangen begynner på den høye tonika og faller trinn for trinn ned en hel oktav — hele skalaen på ett åndedrag, som om gleden ikke kan vente. Teksten svarer med samme bevegelse: himmelens konge kommer NED til jorden, og jorden svarer med sang. At en gjendiktet gammeltestamentlig salme fra 1719 og en amerikansk melodi fra 1839 skulle bli selve julejubelen, var det ingen som planla — men få sanger sier «gled dere!» tydeligere.`,
  sources: [
    'Isaac Watts, The Psalms of David Imitated (1719)',
    'The Modern Psalmist (Lowell Mason, 1839)',
    'John Julian, A Dictionary of Hymnology (1892)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Watts, The Psalms of David Imitated (1719); The Modern Psalmist (1839); Julian, Dictionary of Hymnology (1892)',
    notes:
      'Melodiens forhold til Händel er omdiskutert; artikkelen gjengir den vanlige forskningsvurderingen.',
  },
}

const NAA_TAKKER_ALLE_GUD: HymnStory = {
  songSlug: 'naa-takker-alle-gud',
  title: 'Nå takker alle Gud — takkesalmen fra pestens by',
  bodyMd: `Få salmer har en mørkere bakgrunn enn denne lyse takkesalmen. Martin Rinkart (1586–1649) var prest i den lille byen Eilenburg i Sachsen gjennom hele trettiårskrigen. Byen var omgitt av murer, og dit strømmet flyktninger — og med dem hungersnød og pest. I det verste året, 1637, var Rinkart til slutt den eneste presten igjen i byen. Han skal ha forrettet i tusenvis av begravelser det året, i perioder titalls om dagen. En av dem han begravde, var hans egen kone.

### En bordbønn til barna

Midt i dette skrev Rinkart «Nun danket alle Gott». Etter gammel tradisjon var den først ment som bordbønn for hans egne barn — en enkel takk før maten, bygd over ordene i Siraks bok 50: «Og nå, takk alle Gud, han som gjør store ting over hele jorden.» De to første strofene er ren takk; den tredje er en lovprisning av Faderen, Sønnen og Ånden. At en mann som sto midt i pest, krig og sorg, lærte barna sine å begynne med takk, er selve salmens preken.

### «Det tyske Te Deum»

Melodien kom fra vennen Johann Crüger (1598–1662), kantor i Berlin, som trykte salmen i sin store samling Praxis pietatis melica (1647). Sammen ble tekst og tone raskt hele det lutherske Tysklands takkesang — den kalles gjerne «det tyske Te Deum». Tradisjonen forteller at den ble sunget ved takkegudstjenestene etter Westfalerfreden i 1648, da krigen endelig var over; siden har den fulgt fredsslutninger, jubileer og høsttakkefester. Til Norden kom den tidlig via danske og norske salmebøker, og «Nå takker alle Gud» står fortsatt der menigheten trenger å samle takken i én sang.

### Hvorfor den lever videre

Salmen later ikke som om livet er lett — Rinkart visste bedre enn de fleste hva mennesker kan miste. Men den holder fast på at takken kommer først, «med hjerte, munn og hender»: hele mennesket, ikke bare ordene. Melodiens rolige, oppadgående åpning bærer nettopp det — en takk som reiser seg.`,
  sources: [
    'Praxis pietatis melica (Johann Crüger, 1647)',
    'John Julian, A Dictionary of Hymnology (1892)',
    'Sirak 50,22–24',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Praxis pietatis melica (1647); Julian, Dictionary of Hymnology (1892)',
    notes:
      'Enkeltheter (bordbønn-tradisjonen, sang ved fredsslutningen 1648) er tradisjonsstoff og markert som det.',
  },
}

const IT_IS_WELL: HymnStory = {
  songSlug: 'it-is-well-with-my-soul',
  title: 'It Is Well with My Soul — telegrammet som bare sa «Saved alone»',
  bodyMd: `Horatio Gates Spafford (1828–1888) var advokat og forretningsmann i Chicago, aktiv i byens kristne miljø og venn av vekkelsespredikanten Dwight L. Moody. På få år mistet han nesten alt. Familiens lille sønn døde i 1870. Året etter la den store Chicago-brannen store deler av byen i aske, og med den mye av Spaffords eiendom.

### Ville du Havre

Høsten 1873 ville familien reise til Europa, både for hvile og for å følge Moodys møter i England. Spafford ble igjen i Chicago på grunn av forretninger og sendte sin kone Anna i forveien med deres fire døtre — Annie, Maggie, Bessie og Tanetta. Natten til 22. november kolliderte dampskipet Ville du Havre med seilskipet Loch Earn ute på Atlanterhavet og sank i løpet av minutter. Over to hundre mennesker omkom. Alle fire døtrene druknet.

Anna ble berget og brakt i land i Wales. Derfra sendte hun telegrammet som er blitt stående som en av hymnologiens tyngste setninger: «Saved alone» — reddet alene. Spafford tok første skip over for å hente henne hjem.

### «Det er vel med min sjel»

Etter overleveringen skrev han ordene til salmen på denne overfarten, i nærheten av stedet der skipet var gått ned. Om teksten ble til nøyaktig der, lar seg ikke fastslå — men at den ble skrevet i kjølvannet av tapet, er sikkert. Formen er påfallende nøktern: «When peace like a river attendeth my way, when sorrows like sea billows roll … it is well, it is well with my soul.» Salmen benekter ikke bølgene. Den sier at sjelen kan hvile likevel, fordi den hviler i noe annet enn omstendighetene.

Melodien VILLE DU HAVRE — oppkalt etter skipet — ble skrevet av Philip P. Bliss, og salmen ble trykt i Gospel Hymns No. 2 (1876). Bliss selv omkom bare måneder senere, i en togulykke ved Ashtabula i desember 1876.

### Hvorfor den brukes

Salmen har fått en fast plass i gravferder og i stunder der ord kommer til kort. Den lover ikke at sorgen skal forsvinne, og den forklarer ikke hvorfor ulykken skjedde. Den holder to ting sammen som ellers vil sprenge hverandre: et virkelig tap, og en tillit som ikke slipper. Nettopp derfor tåler den å bli sunget av mennesker som står midt i det.`,
  sources: [
    'Gospel Hymns No. 2 (1876)',
    'John Julian, A Dictionary of Hymnology (1892)',
    'Samtidige beretninger om Ville du Havre-forliset (1873)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Gospel Hymns No. 2 (1876); Julian, Dictionary of Hymnology (1892)',
    notes:
      'At teksten ble skrevet på selve overfarten, over forlisstedet, er tradisjonsstoff og markert som det.',
  },
}

const HOLY_HOLY_HOLY: HymnStory = {
  songSlug: 'holy-holy-holy',
  title: 'Holy, Holy, Holy — treenighetssalmen fra Hodnet',
  bodyMd: `Reginald Heber (1783–1826) var prest i den lille landsbyen Hodnet i Shropshire da han skrev «Holy, Holy, Holy». Han hadde en plan som var uvanlig for sin tid: Den engelske kirke sang stort sett metriske omdiktninger av Davids salmer, og Heber ville i stedet ha salmer skrevet til kirkeårets egne søndager — én for hver. Denne skrev han til treenighetssøndagen.

### Tre ganger hellig

Teksten er en gjendiktning av synet i Johannes' åpenbaring 4, der de fire skapningene dag og natt roper «Hellig, hellig, hellig er Herren Gud, Den allmektige». Heber lar hele salmen kretse om det tretallet: tre ganger «holy», og strofer som følger Faderen, Sønnen og Ånden. Det er ikke en salme om hva mennesket føler, men om hvem Gud er — den er tilbedelse mer enn bekjennelse, og den nevner knapt den som synger.

Andre strofe henter inn de hellige og englene som kaster kronene sine ned foran tronen; tredje strofe innrømmer at mørket skjuler Gud for menneskeøyet. Salmen holder altså to ting sammen: at Gud er over all forstand, og at han likevel skal tilbes.

### Calcutta

Heber rakk aldri å se salmene sine i bruk. I 1823 ble han biskop av Calcutta, med ansvar for et enormt område i India, og han reiste utrettelig i varmen. Tre år senere, i april 1826, døde han brått i Trichinopoly i Sør-India, bare 42 år gammel. Salmene ble gitt ut året etter av enken hans, i samlingen som endelig fikk fram det han hadde arbeidet for.

### Dykes' tone

Melodien vi synger, NICAEA, er skrevet av John Bacchus Dykes til den første utgaven av Hymns Ancient and Modern (1861). Navnet peker på kirkemøtet i Nikea i 325, der kirken formulerte troen på Faderen og Sønnen som «av samme vesen» — altså nøyaktig det læregrunnlaget salmen synger om. Dykes' melodi begynner med en bred, oppadstigende treklang som gir de tre «hellig»-ropene hver sin plass.

At salmen er blitt stående som selve treenighetssalmen i engelskspråklig kirkeliv, skyldes nok denne sjeldne samstemmigheten: en tekst hentet rett fra Skriftens tronsyn, og en tone som er stor nok til å bære den.`,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'Hymns Ancient and Modern (1861)',
    'Reginald Heber, Hymns written and adapted to the weekly church service of the year (1827)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); Hymns Ancient and Modern (1861)',
  },
}

const ABIDE_WITH_ME: HymnStory = {
  songSlug: 'abide-with-me',
  title: 'Abide With Me — kveldssalmen fra Brixham',
  bodyMd: `Henry Francis Lyte (1793–1847) var prest i fiskerlandsbyen Lower Brixham i Devon i over tjue år. Han var svak av helse hele voksenlivet, plaget av tuberkulose, og måtte gjentatte ganger reise sørover om vinteren for å puste lettere.

### Bli hos oss, for det lir mot kveld

Salmens første linje — «Abide with me, fast falls the eventide» — er hentet fra Lukas 24, der de to disiplene på veien til Emmaus ber den fremmede vandreren om å bli: «Bli hos oss, for det lir mot kveld, og dagen heller.» Lyte tar bønnen ut av påskefortellingen og lar den gjelde et helt liv. Kvelden i salmen er ikke bare døgnets; det er livets.

Derfor er dette bare tilsynelatende en kveldssalme. Strofe for strofe måler den hvordan alt annet svikter — «change and decay in all around I see» — og setter opp den ene bønnen mot det: bli hos meg. Siste strofe holder korset opp foran de sviktende øynene og ender i det som er blitt salmens mest siterte linje: «In life, in death, O Lord, abide with me.»

### Den siste søndagen

Den mest utbredte fortellingen er at Lyte skrev salmen i september 1847, kort etter at han hadde holdt sin siste preken for menigheten i Brixham, og at han ga den fra seg før han reiste til Middelhavskysten for helsens skyld. Han kom aldri hjem: han døde i Nice i november samme år. Noen forskere mener teksten kan bygge på et tidligere utkast fra 1820-årene, skrevet ved en døende venns seng. Nøyaktig tilblivelse lar seg ikke fastslå — men at salmen hører hjemme i Lytes eget dødsår, står fast.

### Monks melodi

Tonen EVENTIDE ble skrevet av William Henry Monk, musikkredaktør for Hymns Ancient and Modern, til den første utgaven i 1861. Melodien er lav, jevn og trinnvis, uten et eneste stort sprang — den ber snarere enn den forkynner.

Salmen har fått et bredt liv utenfor gudstjenesten: den synges ved minnemarkeringer, i gravferder og ved store folkelige samlinger. Grunnen er nok den samme overalt. Den lover ikke at kvelden skal utebli. Den ber om selskap i den.`,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'Hymns Ancient and Modern (1861)',
    'Lukas 24,29 (bibelsk bakgrunn)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); Hymns Ancient and Modern (1861)',
    notes:
      'Dateringen av teksten (september 1847 kontra et tidligere utkast) er omdiskutert; artikkelen markerer usikkerheten.',
  },
}

const BLESSED_ASSURANCE: HymnStory = {
  songSlug: 'blessed-assurance',
  title: 'Blessed Assurance — Fanny Crosby og melodien som spurte',
  bodyMd: `Fanny Crosby (1820–1915) mistet synet som spedbarn, etter en behandling som gikk galt da hun var noen få uker gammel. Hun bar aldri nag for det. Selv sa hun heller at blindheten hadde gitt henne en gave: hun slapp å bli avledet, og kunne holde et helt dikt i hodet til det var ferdig.

### Åtte tusen tekster

Crosby ble utdannet ved New York Institution for the Blind og ble siden lærer der. Fra 1860-årene skrev hun salmetekster i et omfang få har vært i nærheten av — anslagene ligger rundt åtte tusen. Hun dikterte dem; hun skrev sjelden selv. Fordi forleggerne fryktet at salmebøkene skulle se ut som ettmannsverk, ga hun ut mye under pseudonymer, over hundre av dem. Ved siden av dette arbeidet drev hun et langt engasjement for fattige i New York.

### «Hva sier denne melodien?»

Historien om denne salmen er godt overlevert. I 1873 var Crosby på besøk hos venninnen Phoebe Palmer Knapp, som var en dyktig amatørkomponist. Knapp satte seg ved instrumentet og spilte en melodi hun nettopp hadde laget, og spurte: «Hva sier denne melodien?» Crosby lyttet, og svarte: «Blessed assurance, Jesus is mine!» Teksten kom altså etter tonen, ikke før — noe som forklarer hvor tett ord og rytme sitter sammen.

Salmen ble trykt samme år i tidsskriftet Palmer's Guide to Holiness and Revival Miscellany.

### Vissheten

Ordet «assurance» er nøkkelen. Teksten bygger på Hebreerbrevets tale om å tre fram for Gud «med full visshet i troen» — ikke en visshet mennesket har skaffet seg selv, men en som hviler på det Kristus har gjort. Derfor kan salmen si «this is my story, this is my song» uten å bli selvsentrert: fortellingen den synger, er ikke sangerens prestasjon.

Melodien ASSURANCE svinger i en vuggende tredelt takt som har gjort salmen lett å bli med på, og som ga den fast plass i vekkelsesmøtenes repertoar. Nettopp den kombinasjonen — en sikker teologisk grunn og en melodi som bærer en hel forsamling — har holdt den i bruk i halvannet hundre år.`,
  sources: [
    "Palmer's Guide to Holiness and Revival Miscellany (1873)",
    'John Julian, A Dictionary of Hymnology (1892)',
    'Fanny Crosby, Memories of Eighty Years (1906)',
  ],
  rights: {
    source:
      "Egen tekst; kilder: Palmer's Guide to Holiness (1873); Julian, Dictionary of Hymnology (1892); Crosby, Memories of Eighty Years (1906)",
  },
}

const COME_THOU_FOUNT: HymnStory = {
  songSlug: 'come-thou-fount',
  title: 'Come, Thou Fount — salmen som innrømmer at den vandrer bort',
  bodyMd: `Robert Robinson (1735–1790) var en engelsk gutt uten særlige utsikter: faren døde tidlig, og han ble satt i lære hos en frisør i London. Som attenåring gikk han — etter eget utsagn i spott — for å høre vekkelsespredikanten George Whitefield. Det ble ikke som han hadde tenkt. Prekenen fulgte ham i nesten tre år før han slo seg til ro med troen. Han ble siden forkynner, først i metodistiske og kongregasjonalistiske kretser, til slutt baptistpastor i Cambridge.

### En Eben-Eser midt i salmen

Teksten skrev han i 1758, bare 23 år gammel. Midt i den står en linje som ofte får folk til å stoppe: «Here I raise mine Ebenezer.» Det er ikke et navn, men et sted. I 1. Samuelsbok 7 setter Samuel opp en stein etter en berging og kaller den Eben-Eser, «hjelpesteinen», med ordene «Hittil har Herren hjulpet oss». Robinson lar den som synger, reise sin egen slike stein: hit har jeg kommet, og ikke ved egen kraft.

### «Prone to wander»

Det som gjør salmen uvanlig, er hvor lite den skryter. Siste strofe sier rett ut: «Prone to wander, Lord, I feel it — prone to leave the God I love.» Den ber ikke om å bli fortalt at faren er over; den ber om å bli bundet fast, «bind my wandering heart to Thee». Få salmer lar en menighet innrømme sin egen ustøhet så tydelig, og nettopp derfor kjenner mange seg igjen i den.

En mye fortalt anekdote vil ha det til at Robinson mange år senere satt i en vogn ved siden av en kvinne som nynnet på hans egen salme, og at han svarte henne at han ville gitt tusen verdener for å eie følelsene han hadde da han skrev den. Historien er ikke dokumentert i samtidige kilder og bør leses som overlevering — men den har festet seg fordi den svarer så nøyaktig på salmens siste strofe.

### Melodien NETTLETON

Tonen vi synger, dukket opp i den amerikanske notesamlingen Wyeth's Repository of Sacred Music, Part Second (1813). Den bærer navnet NETTLETON etter vekkelsespredikanten Asahel Nettleton, men at han skulle ha komponert den, er usikkert. Melodien har uansett det folkelige, nesten dansende preget som kjennetegner amerikansk vekkelsessang fra denne tiden.`,
  sources: [
    "Wyeth's Repository of Sacred Music, Part Second (1813)",
    'John Julian, A Dictionary of Hymnology (1892)',
    '1. Samuelsbok 7,12 (bibelsk bakgrunn)',
  ],
  rights: {
    source:
      "Egen tekst; kilder: Wyeth's Repository of Sacred Music (1813); Julian, Dictionary of Hymnology (1892)",
    notes:
      'Vogn-anekdoten er udokumentert overlevering og markert som det; melodiens opphavsmann er usikker.',
  },
}

const NEARER_MY_GOD: HymnStory = {
  songSlug: 'nearer-my-god-to-thee',
  title: 'Nearer, My God, to Thee — Jakobs stige, og en fortelling om Titanic',
  bodyMd: `«Nearer, My God, to Thee» ble skrevet av engelske Sarah Flower Adams (1805–1848) og trykt i samlingen Hymns and Anthems i 1841. Adams hørte hjemme i et frisinnet, unitarisk menighetsmiljø i London, og skrev teksten på oppdrag fra sin prest, som manglet en salme til en preken han skulle holde. Søsteren Eliza Flower, som var komponist, satte den første melodien.

### Steinen som ble en pute

Salmen er en gjendiktning av 1. Mosebok 28. Jakob er på flukt fra broren sin, kommer til et øde sted når solen går ned, legger en stein under hodet og sovner. I drømmen ser han en stige som når fra jorden til himmelen, med Guds engler som går opp og ned, og han våkner med ordene: «Sannelig, Herren er på dette stedet, og jeg visste det ikke.»

Adams følger fortellingen tett: «Though like the wanderer, the sun gone down, darkness be over me, my rest a stone.» Det er en salme for det stedet der ingenting er som det skal, og der nærheten til Gud likevel viser seg å være der. Merk hva den ikke ber om. Den ber ikke om at mørket skal ta slutt, men om å komme nærmere — også gjennom mørket, «e'en though it be a cross that raiseth me».

### Melodien BETHANY

I Amerika synges salmen nesten alltid til Lowell Masons melodi BETHANY, skrevet i 1856 og trykt i The Sabbath Hymn and Tune Book (1859). I Storbritannia er andre toner like vanlige, blant dem HORBURY av John Bacchus Dykes. Ulike melodier er en av grunnene til at fortellingene om salmen spriker.

### Titanic

Salmen er blitt uløselig knyttet til Titanics forlis i april 1912: den mest utbredte fortellingen sier at skipets orkester spilte den mens skipet sank. Overlevende ga imidlertid ulike forklaringer, og andre samtidige beretninger nevner et helt annet stykke. Hva som faktisk lød den natten, lar seg ikke avgjøre.

Salmen var uansett allerede kjent for å følge mennesker inn i døden — den ble blant annet spilt ved president William McKinleys begravelse i 1901, etter at han skal ha sitert den på dødsleiet. At den siden fikk Titanic-historien på seg, sier mest om hva mennesker har ønsket skulle bli sunget når alt annet gir etter.`,
  sources: [
    'Sarah Flower Adams, i Hymns and Anthems (1841)',
    'The Sabbath Hymn and Tune Book (1859)',
    'John Julian, A Dictionary of Hymnology (1892)',
    '1. Mosebok 28,10–22 (bibelsk bakgrunn)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Hymns and Anthems (1841); The Sabbath Hymn and Tune Book (1859); Julian, Dictionary of Hymnology (1892)',
    notes:
      'Titanic-fortellingen er tradisjon med motstridende øyenvitneutsagn og er uttrykkelig markert som uavklart.',
  },
}

const JUST_AS_I_AM: HymnStory = {
  songSlug: 'just-as-i-am',
  title: 'Just As I Am — «kom akkurat som du er»',
  bodyMd: `Charlotte Elliott (1789–1871) vokste opp i et velstående og kirkelig engasjert engelsk hjem, med god utdannelse og et lyst humør. I begynnelsen av trettiårene brøt helsen sammen. Hun ble aldri frisk igjen, og levde resten av sitt lange liv som pleietrengende — over førti år.

### Setningen som ble hengende

I 1822 var den sveitsiske predikanten César Malan gjest hos familien. Etter overleveringen var Elliott bitter og avvisende da han spurte om hun hadde fred med Gud, og samtalen endte i uvennskap. Noen dager senere kom hun tilbake til ham og spurte hva hun i så fall måtte gjøre for å komme til Kristus. Svaret hun fikk, ble stående: «Kom akkurat som du er.»

### Bazaren hun ikke kunne hjelpe til på

Selve teksten kom først tolv år senere, i 1834. Familien arbeidet da med å samle inn penger til en skole for prestedøtre i Brighton, og hele husstanden var i sving. Elliott lå syk, ute av stand til å bidra med noe som helst, og kjente det som en nytteløshet som gikk dypere enn dagen: hva hadde hun å komme med? Om natten skrev hun ned strofene som svarer på nettopp det. «Just as I am, without one plea, but that Thy blood was shed for me.» Ingen påberopelse, ingen forbedring på forhånd, ingen ytelse — bare det at hun ble kalt.

Salmen ble trykt i The Invalid's Hymn Book og i hennes egen samling Hours of Sorrow. Broren, presten Henry Venn Elliott, skal ha sagt at et helt liv i tjeneste ikke hadde båret den frukten søsterens ene salme gjorde.

### Bradburys melodi, og et langt etterliv

Melodien WOODWORTH ble skrevet av amerikaneren William B. Bradbury og trykt i 1849. Den er lav, enkel og lett å synge selv med tung stemme — noe som gjorde den til den innbydelsessalmen kirken har brukt mest. I det tjuende århundret fikk den enda større utbredelse gjennom store vekkelsesmøter, der den ble sunget mens folk gikk fram.

Kraften i salmen ligger i at den ikke krever noe først. Den lar mennesket komme med sykdommen, tvilen og alt det uferdige i behold — «O Lamb of God, I come».`,
  sources: [
    'Charlotte Elliott, The Invalid’s Hymn Book (1836) og Hours of Sorrow (1836)',
    'The Mendelssohn Collection / Third Book of Psalmody (1849)',
    'John Julian, A Dictionary of Hymnology (1892)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Elliott, The Invalid’s Hymn Book (1836); Julian, Dictionary of Hymnology (1892)',
    notes:
      'Samtalen med César Malan (1822) og broren Henry Venn Elliotts utsagn er salmehistorisk overlevering, gjengitt som det.',
  },
}

const O_COME_ALL_YE_FAITHFUL: HymnStory = {
  songSlug: 'o-come-all-ye-faithful',
  title: 'Adeste fideles — julesalmen med et uklart opphav',
  bodyMd: `«O Come, All Ye Faithful» heter opprinnelig «Adeste fideles» og er skrevet på latin. Hvem som skrev den, var lenge et åpent spørsmål, og noen av trådene er fortsatt løse.

### Wade i Douai

De eldste håndskriftene vi kjenner, er skrevet av John Francis Wade (ca. 1711–1786) på 1740-tallet. Wade var engelsk katolikk og levde i eksil i Douai i Nord-Frankrike, der det fantes et miljø av engelske katolikker som ikke kunne praktisere troen hjemme. Han livnærte seg som notekopist og skrev ut liturgiske bøker for katolske menigheter og skoler. Salmen kom på trykk i hans egen samling Cantus Diversi (1751).

Lenge ble teksten tilskrevet middelalderteologen Bonaventura, og melodien den portugisiske kongen Johan IV — den gikk faktisk under navnet «den portugisiske hymnen» i England, fordi den ble sunget i det portugisiske ambassadekapellet i London. Nyere forskning, særlig fra 1900-tallet, legger både tekst og tone hos Wade selv. Helt avgjort er saken likevel ikke.

En egen forskningshypotese leser salmen som en skjult jakobittisk sang: «fideles» som de trofaste tilhengerne av den landflyktige Stuart-tronkreveren, Betlehem som England. Det er en tolkning, ikke et fastslått faktum, og den bør leses som nettopp det.

### «Kom, la oss tilbe ham»

Innholdet er derimot helt uten dobbeltbunn. Salmen er en innbydelse: kom, la oss dra, la oss se. Den maler ikke julenatten fra utsiden, men roper de troende av sted til Betlehem — «venite adoremus», kom, la oss tilbe ham. Andre strofe henter inn den nikenske trosbekjennelsens språk om Sønnen som er «Gud av Gud, lys av lys», og setter det ved siden av barnet i krybben. Det er hele julens mysterium i to linjer.

Den engelske teksten vi kjenner best, er Frederick Oakeleys gjendiktning fra 1841, senere revidert. På norsk finnes salmen i flere gjendiktninger.

Melodien har den samme innbydende bevegelsen som ordene: en fast, marsjaktig oppgang, og et refreng der hele forsamlingen kan falle inn. Det er en salme som ikke ber om stemning, men om oppmøte.`,
  sources: [
    'John Francis Wade, Cantus Diversi (ca. 1751)',
    'Murray’s Hymnal (1852)',
    'John Julian, A Dictionary of Hymnology (1892)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Wade, Cantus Diversi (ca. 1751); Julian, Dictionary of Hymnology (1892)',
    notes:
      'Forfatterskapet er ikke endelig avklart, og den jakobittiske lesningen er en hypotese; begge deler er markert i teksten.',
  },
}

const DEILIG_ER_JORDEN: HymnStory = {
  songSlug: 'deilig-er-jorden',
  title: 'Deilig er jorden — pilegrimssangen som ble julesalme',
  bodyMd: `«Deilig er jorden» er for mange selve julen — og likevel handler den ikke om julenatten. Den nevner verken krybbe, hyrder eller stjerne. Den er en pilegrimssang.

### Ingemann, 1850

Teksten er skrevet av dansken Bernhard Severin Ingemann (1789–1862), dikter, salmeforfatter og lærer ved akademiet i Sorø. Den sto på trykk i Dansk Kirketidende i 1850, med overskriften «Pilgrimssang». Danmark hadde nettopp vært gjennom treårskrigen, og salmen kom ut i et land som telte sine tap.

Det preger den. Ingemann ser jorden som vakker, men gjennomreist: «Skjønn er sjelenes pilegrimsgang.» Slektene skifter, tidene går — «slekt skal følge slekters gang» — men sangen fra himmelen fortsetter over alle som er på vandring. Det er en trøstesalme om at reisen har et mål, ikke en beskrivelse av en fredelig verden.

### En schlesisk folketone

Melodien er en tysk-schlesisk folketone, kjent i Tyskland som «Schönster Herr Jesu», trykt blant annet i en samling schlesiske folkeviser fra 1842. På 1800-tallet ble den gjerne kalt «korsfarernes hymne», med den forklaringen at tyske korsfarere hadde sunget den på vei til Det hellige land i middelalderen. Den historien har ikke støtte i eldre kilder og regnes i dag som en romantisk konstruksjon fra 1800-tallet — melodien er utvilsomt langt yngre enn korstogene.

### Hvorfor akkurat i julen

Ingemanns tredje strofe handler om englesangen over Betlehemsmarken, og det var trolig nok til at salmen fant veien inn i julen. Der ble den værende, i hele Norden, både i kirken og hjemme rundt treet.

Samtidig er den blitt en av de mest brukte gravferdssalmene vi har. Det er ingen motsetning. Salmen sier det samme i begge tilfeller: vi er underveis, og det er sunget fred over veien. Nettopp fordi den ikke maler julenatten, men vandringen gjennom livet, tåler den å bli sunget både når det er som lysest og når det er som tyngst.

Den norske teksten følger Ingemanns danske original tett, med de mindre språklige tilpasningene som fulgte med i norske salmebøker.`,
  sources: [
    'B. S. Ingemann, i Dansk Kirketidende (1850)',
    'Schlesisk folketone («Schönster Herr Jesu»), samlinger fra 1842',
    'Hans Skaar, Norsk Salmehistorie (1879–80)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Ingemann i Dansk Kirketidende (1850); Skaar, Norsk Salmehistorie (1879–80)',
    notes:
      'Korsfarer-opphavet til melodien er en 1800-talls legende og omtales som avvist i artikkelen.',
  },
}

const GO_DOWN_MOSES: HymnStory = {
  songSlug: 'go-down-moses',
  title: 'Go Down, Moses — «la mitt folk fare»',
  bodyMd: `«Go Down, Moses» ble sunget av mennesker som var holdt som slaver i USA. Det er verdt å si rett ut før noe annet: dette er ikke en gammel folkevise med et fromt anstrøk, men et vitnesbyrd fra mennesker som ble eid av andre mennesker.

### Israel i Egypt

Teksten går rett inn i 2. Mosebok. Gud sender Moses til farao med beskjeden i 2. Mos 5,1: «La mitt folk fare.» Sangen gjentar den setningen igjen og igjen — «Tell old Pharaoh: let my people go» — og lar første vers si hvem det handler om: «When Israel was in Egypt's land, oppressed so hard they could not stand.»

For dem som sang den, var dette ikke en fortelling om noen andre for lenge siden. Israel var dem selv. Egypt var Sørstatene. Farao var slaveeieren. Sangen sier at Gud allerede én gang har stilt seg på de undertryktes side og krevd dem fri — og at han er den samme.

Det gjør sangen påfallende uredd. Den ber ikke om medlidenhet og den ber ikke om tålmodighet. Den framfører et krav, og den legger kravet i Guds egen munn.

### Nedtegnelsen

Sangen er blant de aller tidligst nedskrevne spirituals. Den ble notert ned i 1861–62 blant mennesker som hadde flyktet til Fort Monroe i Virginia, og trykt som noter i 1862 — den første afroamerikanske spiritual som kom ut på den måten. Fem år senere sto den i samlingen Slave Songs of the United States (1867). Fra 1870-tallet bar Fisk Jubilee Singers den ut i verden.

Melodien er modal og i moll, bygd på kall og svar: en forsanger fører, forsamlingen svarer med «let my people go». Den formen er i seg selv en del av innholdet — dette er en sang som krever et fellesskap for å kunne synges.

### I dag

Sangen sto siden sentralt i borgerrettsbevegelsen, og Harriet Tubman, som ledet mennesker ut av slaveriet, ble kalt «Moses». Å synge den er å låne ord fra mennesker som holdt fast ved at Gud ser undertrykkelse og ikke lar den bli stående. Det fortjener å bli sunget med det i minne.`,
  sources: [
    'Slave Songs of the United States (1867)',
    'The Song of the Contrabands: O Let My People Go (nedtegnet 1861–62, utgitt 1862)',
    'Jubilee Songs / Fisk Jubilee Singers (1872)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Slave Songs of the United States (1867); Fisk Jubilee Singers-tradisjonen (1872)',
    notes:
      'Enkeltdetaljer i spirituals-overleveringen er ofte usikre; artikkelen holder seg til det som er dokumentert i utgivelsene sangen bygger på.',
  },
}

const DEEP_RIVER: HymnStory = {
  songSlug: 'deep-river',
  title: 'Deep River — elven som skiller, og landet på den andre siden',
  bodyMd: `«Deep River» hører til den samme arven som «Go Down, Moses»: sanger som ble til blant slavebundne afroamerikanere i USA på 1800-tallet. Der «Go Down, Moses» krever, lengter «Deep River». Den er stille, bred og langsom, og den ser mot noe som ligger på den andre siden av vannet.

### Jordan

«Deep river, my home is over Jordan.» Elven er Jordan, den israelittene måtte krysse for å komme inn i det lovede landet etter ørkenvandringen. I kristen sangtradisjon er den samme elven blitt et bilde på døden: å gå over Jordan er å komme hjem til Gud.

For dem som først sang den, hadde bildet mer enn ett lag. Himmelen og hvilen hos Gud var det ene. Men en elv som skilte trelldom fra frihet, var også høyst konkret i deres verden — nordover, over Ohio, lå stater der slaveriet ikke gjaldt. Hvor bevisst denne dobbeltheten var i hvert enkelt tilfelle, vet vi ikke; at bildespråket bar begge deler, er derimot klart.

Andre del av sangen ser fram mot «that gospel feast, that promised land where all is peace» — et festmåltid, ikke bare en hvile. Det er en fremtid der ingen lenger blir eid.

### Nedtegnelsene

Sangen ble skrevet ned og gitt ut fra 1870-årene, blant annet i utgivelsene knyttet til Fisk Jubilee Singers, og siden i Hamptons samling Religious Folk-Songs of the Negro (1918). Det er disse eldre, tradisjonelle nedtegnelsene arrangementene her bygger på.

Det finnes også en kjent konsertversjon fra 1910-årene ved Harry T. Burleigh, som gjorde «Deep River» til et fast innslag i klassiske sangprogrammer. Den er et selvstendig, yngre arbeid og ligger utenfor det vi bruker her — melodien du finner i biblioteket, følger den eldre folkeformen.

### Å synge den

Sangen tåler dårlig hastverk. Den bygger på en lang, bærende linje som skal få tid, og den vinner på å synges i flerstemt fellesskap. Å synge den er å låne ordene til mennesker som holdt fast ved at det finnes et hjem — også når ingenting i deres eget liv tydet på det.`,
  sources: [
    'Religious Folk-Songs of the Negro (Hampton, 1918)',
    'Jubilee Songs / Fisk Jubilee Singers (1872)',
    'Josva 3 (bibelsk bakgrunn — Jordan)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Religious Folk-Songs of the Negro (Hampton, 1918); Jubilee Songs (1872)',
    notes:
      'Sangens tidligste opphav er ikke sikkert dokumentert. Burleighs konsertarrangement (1916–17) er en egen, yngre versjon som IKKE brukes her.',
  },
}

const DEG_VAERE_AERE: HymnStory = {
  songSlug: 'deg-vaere-aere',
  title: 'Deg være ære — seiersmarsjen fra en Händel-opera',
  bodyMd: `«Deg være ære» er påskedagens jubelsalme i Norden, og den eneste av de store påskesalmene som er bygd på en marsj fra et oratorium.

### Händels seierskor

Melodien heter MACCABAEUS og er skrevet av Georg Friedrich Händel. Han komponerte den til koret «See, the conquering hero comes» — «se, seierherren kommer». Musikken hørte først hjemme i oratoriet Joshua (1747), men Händel flyttet den siden over i Judas Maccabaeus, der den ble så populær at den for alltid er blitt knyttet til det verket.

Melodien er nettopp det den var laget for: en innmarsj. Den begynner lavt og samlet, stiger, og åpner seg i et refreng en hel forsamling kan bære. Da den fikk påsketekst, fulgte hele denne bevegelsen med — det er den oppstandne som kommer inn.

### Budry i Vevey

Teksten «À toi la gloire, ô Ressuscité» ble skrevet på fransk i 1884 av Edmond Louis Budry (1854–1932), reformert prest i Vevey ved Genèvesjøen. Den mest utbredte fortellingen sier at han skrev den etter at hans første kone døde. Om det er tilblivelsesgrunnen, lar seg ikke fastslå fra samtidige kilder, men salmen bærer uansett spor av å være skrevet av en som visste hva en grav er.

Teksten går rett på: «Deg være ære, Herre over dødens makt.» Den argumenterer ikke for oppstandelsen — den hilser den. Andre strofe fører oss til den tomme graven og til engelen som spør hvorfor de leter etter den levende blant de døde. Tredje strofe trekker konsekvensen for den som synger: fordi han lever, trenger jeg ikke frykte.

### Veien til norske kirker

Salmen kom til engelsk i 1923 som «Thine Be the Glory» og bredte seg raskt videre i Nord-Europa. Den norske syngeteksten er en langt yngre gjendiktning med sine egne rettigheter; arrangementene i dette biblioteket bygger på Händels melodi og Budrys franske original, som begge er fri for opphavsrett.

I gudstjenesten hører den hjemme på påskedag, gjerne som utgangssalme — der en menighet skal reise seg og gå ut. Melodien var tross alt en marsj før den ble en salme.`,
  sources: [
    'G. F. Händel, Joshua (1747) / Judas Maccabaeus',
    'Edmond Budry, «À toi la gloire» (1884)',
    'John Julian, A Dictionary of Hymnology (1892)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Händel, Judas Maccabaeus (1747); Budry, «À toi la gloire» (1884)',
    notes:
      'At teksten ble skrevet etter Budrys første kones død, er overlevering og markert som det. Nyere norske gjendiktninger er ikke gjengitt her.',
  },
}

const VAAR_GUD_BORG: HymnStory = {
  songSlug: 'vaar-gud-han-er-saa-fast-en-borg',
  title: 'Vår Gud han er så fast en borg — Luthers Salme 46',
  bodyMd: `«Ein feste Burg ist unser Gott» er den mest kjente salmen Martin Luther skrev, og den eneste av dem der han både diktet teksten og laget melodien. Den regnes gjerne som reformasjonens kampsang.

### Salme 46

Grunnlaget er Salme 46: «Gud er vår tilflukt og vår styrke, en hjelp i nød og alltid nær.» Luther gjendikter den ikke ordrett, men skriver den om til sitt eget århundre. Borgen i første linje er ikke et bilde han fant på; middelalderens mennesker visste konkret hva en borg var — stedet man flyktet til når det brant utenfor murene.

Salmen er blitt kalt en kampsang, og den har et krigersk billedspråk. Men det er verdt å legge merke til hvem som slåss. Andre strofe sier rett ut at «vår egen makt er intet verd» — mennesket taper hvis det står alene. Det er ikke en sang om reformatorenes styrke, men om at styrken ligger et annet sted. Tredje strofe tør derfor si at om verden var full av djevler, skulle vi likevel ikke frykte.

Siste strofe er den mest radikale: de kan ta gods, ære, liv og familie, og likevel har de ikke vunnet noe. Luther skriver dette som en mann som selv var lyst fredløs.

### Datering og kilder

Nøyaktig når salmen ble til, vet vi ikke. Den eldste trykte utgaven vi har bevart, står i Klugs Geistliche Lieder (Wittenberg 1533); et eldre trykk fra rundt 1529 er kjent, men ikke bevart. De vanlige historiene om at den ble skrevet til en bestemt riksdag, er ikke belagt.

Heinrich Heine kalte den senere «reformasjonens Marseillaise» — et treffende, men også farlig ord, som har fristet ettertiden til å bruke salmen mer nasjonalt enn Luther skrev den.

### To melodiformer

Luthers egen melodi var rytmisk livlig, med synkoper og ujevne notelengder. På 1600- og 1700-tallet ble den jevnet ut til like lange toner — den brede, tunge koralformen de fleste norske menigheter kjenner. Begge former brukes i dag. Den norske teksten står i Landstads salmebok-tradisjon.`,
  sources: [
    'Martin Luther, i Klug: Geistliche Lieder (Wittenberg 1533)',
    'Salme 46 (bibelsk bakgrunn)',
    'Hans Skaar, Norsk Salmehistorie (1879–80)',
    'Landstads salmebok',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Klug, Geistliche Lieder (1533); Skaar, Norsk Salmehistorie (1879–80); Landstads salmebok',
    notes:
      'Dateringen er usikker (eldste bevarte trykk 1533) og knytningen til en bestemt riksdag er ubelagt; begge deler er markert.',
  },
}

/** All hymn stories, keyed by song slug via content.ts lookups. Order is only
 * for listing; lookups go through hymnStoryFor(). */
export const hymnStories: HymnStory[] = [
  AMAZING_GRACE,
  AMAZING_GRACE_FIRSTEMMIG,
  GLADE_JUL,
  JOYFUL_JOYFUL,
  KIRKEN_DEN_ER,
  PASKEMORGEN,
  WHAT_A_FRIEND,
  SWING_LOW,
  WHEN_THE_SAINTS,
  KUMBAYA,
  JOY_TO_THE_WORLD,
  NAA_TAKKER_ALLE_GUD,
  IT_IS_WELL,
  HOLY_HOLY_HOLY,
  ABIDE_WITH_ME,
  BLESSED_ASSURANCE,
  COME_THOU_FOUNT,
  NEARER_MY_GOD,
  JUST_AS_I_AM,
  O_COME_ALL_YE_FAITHFUL,
  DEILIG_ER_JORDEN,
  GO_DOWN_MOSES,
  DEEP_RIVER,
  DEG_VAERE_AERE,
  VAAR_GUD_BORG,
]
