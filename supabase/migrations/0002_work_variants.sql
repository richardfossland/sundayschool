-- SundaySchool 0002: work/variant model. A "work" (verk) is the underlying
-- song; each row is one playable arrangement (variant) of it. `work_slug`
-- groups variants of the same work (library shows one card per work with a
-- level picker); `variant_label` is the human name of the variant ('Enkel',
-- 'Firstemmig', 'Gospel') — null = the work's only/standard arrangement.
--
-- Additive + idempotent — safe to re-run. Run this BEFORE deploying the v3
-- client (META_COLUMNS selects the new columns; until then fetchSongs falls
-- back to the bundled seeds, so order slips are safe but ugly).

alter table school.songs add column if not exists work_slug text;
alter table school.songs add column if not exists variant_label text;

-- Backfill: every existing row is its own work …
update school.songs set work_slug = slug where work_slug is null;

-- … except the hand-written firstemmig variant, which belongs to the
-- amazing-grace work (the only pre-0002 multi-variant work).
update school.songs
set work_slug = 'amazing-grace', variant_label = 'Firstemmig'
where slug = 'amazing-grace-firstemmig'
  and (work_slug is distinct from 'amazing-grace'
    or variant_label is distinct from 'Firstemmig');

alter table school.songs alter column work_slug set not null;

-- Library groups by work; the level picker fetches all variants of one work.
create index if not exists songs_work_slug_idx on school.songs (work_slug);
