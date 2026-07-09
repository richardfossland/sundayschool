# SundaySchool

Interaktiv piano-læringsapp for salmer, hymner, gospel og lovsang — «fallende
noter» à la Synthesia, men web-basert, penere og med kirkemusikerens behov i
sentrum: transponering som førsteklasses funksjon, ekte notasjon synkronisert
med fallende noter, vent-modus per hånd, og (fase 2) besifringsmodus som
validerer enhver gyldig voicing av akkorden.

Del av [Sunday Suite](https://sundaysuite.app) — `school.sundaysuite.app`.

## Innhold og rettigheter

Alt bundlet repertoar er **egenproduserte arrangementer av verk i det fri**
(alle opphavere — komponist, tekstforfatter, oversetter, kildearrangør — døde
før 1956, dobbelt-PD-verifisert for både EØS og USA). Hver sang bærer et
`rights`-felt med opphavere/dødsår, kilde og verifiseringsdato; se
`/om-rettigheter` i appen. Brukeropplastet MIDI (fase 2) parses og spilles
utelukkende lokalt i nettleseren og sendes aldri til server.

## Stack

Next 16 + React 19 + Tailwind 4 + OpenNext → Cloudflare Workers. Supabase
(delt suite-prosjekt, eget `school`-schema, RLS: anon leser kun published).
Tone.js Sampler (Salamander-flygel) for lyd, Web MIDI for keyboard-input
(skjermklaviatur-fallback der Web MIDI mangler — Safari/iOS), VexFlow for
notasjon. Sangformatet er semantisk JSON (`SongDoc`) — aldri rå MIDI — så
transponering og tempo er rene tallendringer.

## Utvikling

```bash
npm install
cp .env.local.example .env.local  # fyll inn Supabase-verdier
npm run dev
npm run check    # tsc + vitest
npm run cf:build # verifiser OpenNext/Workers-bygget
```

Uten `.env.local` faller appen tilbake til bundlet seed-innhold.

Se `DEPLOY.md` for go-live-rekkefølgen (migrasjon → eksponer schema → seed →
deploy → røyktest).
