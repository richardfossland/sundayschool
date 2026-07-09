-- SundaySchool: dedicated `school` schema in the shared SundaySuite Supabase
-- project. Idempotent — safe to re-run.
--
-- AFTER running this migration the `school` schema must ALSO be added under
-- Dashboard → Settings → API → Exposed schemas, or PostgREST returns 404/406
-- for every request. (Both steps are required — learned in SundayLicks 0001.)

create schema if not exists school;

create table if not exists school.songs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  tradition text not null check (tradition in ('salme', 'hymne', 'spiritual', 'gospel', 'lovsang')),
  difficulty smallint not null check (difficulty between 1 and 3),
  original_key smallint not null check (original_key between 0 and 11),
  mode text not null default 'major' check (mode in ('major', 'minor')),
  default_bpm smallint not null check (default_bpm between 20 and 300),
  arrangement_style text not null default 'enkel',
  -- The full semantic score (SongDoc): sections, notes, chords, key/time
  -- signature. See src/types/song.ts — formatVersion inside allows migration.
  doc jsonb not null,
  -- Public-domain documentation (Rights): creators with death years, sources,
  -- verification date. Mandatory — every published song must prove PD status.
  rights jsonb not null,
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now()
);

alter table school.songs enable row level security;

drop policy if exists "read published" on school.songs;
create policy "read published" on school.songs
  for select using (status = 'published');

-- Grants: PostgREST roles need explicit usage/select even with RLS in place,
-- and service_role must be included or seeding fails with "permission denied
-- for schema school" (SundayLicks gotcha, baked in from day one here).
grant usage on schema school to anon, authenticated, service_role;
grant select on school.songs to anon, authenticated;
grant all privileges on school.songs to service_role;
