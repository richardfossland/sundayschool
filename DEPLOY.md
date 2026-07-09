# Go-live-rekkefølge (rekkefølge-kritisk)

Samme mønster som SundayLicks. Eier-steg er merket 👤.

1. 👤 **Migrasjon:** kjør `supabase/migrations/0001_school_schema.sql` i
   SQL-editoren på det delte suite-prosjektet.
2. 👤 **Eksponer schema:** Dashboard → Settings → API → Exposed schemas →
   legg til `school`. (Uten dette svarer PostgREST 404/406 på alt.)
3. **Seed:** `npm run seed` (krever `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`).
   Verifiser: anon-spørring viser published-sanger; anon INSERT → 401.
4. **Bygg:** `npm run check && npm run cf:build` — begge grønne før deploy.
5. 👤 **Deploy-OK:** eksplisitt godkjenning, deretter `npm run cf:deploy`
   (NEXT_PUBLIC_* inlines fra `.env.local` ved bygg).
6. **Røyktest:** alle ruter 200 (`/`, `/bibliotek`, `/sang/<slug>`,
   `/om-rettigheter`), spill én sang i prod, transponer live.
   NB: helt nye ruter kan gi stale 404 fra edge-cache rett etter deploy —
   re-prob etter ~30 s før feilsøking.
7. **Nettside:** legg SundaySchool-kort i `sundaysuite-website` (build.py) og
   deploy nettsiden (eget repo/rutine).

Ingen Worker-secrets i MVP (ingen server-skrivestier). `SUPABASE_SERVICE_ROLE_KEY`
brukes kun lokalt av seed-scriptet.
