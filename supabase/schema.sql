-- RagnarHabits – Datenbankschema für Supabase (Postgres)
-- Ausführen im Supabase SQL-Editor des Projekts (Dashboard → SQL Editor → New query).
--
-- Modell:
--   auth.users          -- von Supabase Auth verwaltet
--   households          -- ein "Haushalt" = eine Gruppe, die sich Daten teilt (du + Freund)
--   household_members    -- wer gehört zu welchem Haushalt (many-to-many, hier meist 1 Nutzer = 1 Haushalt)
--   dogs                 -- Hunde gehören zu einem Haushalt, nicht zu einem einzelnen Nutzer
--   behavior_events       -- die eigentlichen Tracking-Einträge (Bellen, Spaziergang, ...)
--
-- Sicherheit: Row-Level-Security (RLS) stellt sicher, dass ein Nutzer ausschließlich
-- Daten seines/seiner eigenen Haushalte lesen/schreiben kann. Es gibt keinen Weg,
-- über den PostgREST/Supabase-Client an fremde Haushalte zu kommen.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- households
-- ---------------------------------------------------------------------------
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mein Haushalt',
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- household_members  (Zuordnung Nutzer <-> Haushalt, ermöglicht das Teilen)
-- ---------------------------------------------------------------------------
create table if not exists household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ---------------------------------------------------------------------------
-- dogs
-- ---------------------------------------------------------------------------
create table if not exists dogs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  breed text,
  birth_date date,
  bio text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- behavior_events  (die getrackten Verhaltens-/Aktivitäts-Einträge)
-- ---------------------------------------------------------------------------
create table if not exists behavior_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  dog_id uuid not null references dogs (id) on delete cascade,
  category text not null check (
    category in (
      'toilet', 'eat', 'sleep', 'rest', 'play', 'cuddle', 'enrichment',
      'reaction', 'social', 'car', 'training', 'wake', 'vet', 'observation', 'other'
    )
  ),
  -- Nur bei category = 'toilet' relevant: war der Lösen-Versuch erfolgreich,
  -- am falschen Ort (z.B. Crate), oder erfolglos? Kern des Haustrainings-Trackings.
  outcome text check (outcome in ('success', 'wrong_place', 'fail')),
  note text,
  raw_transcript text, -- Originaltext der Spracheingabe, für Nachvollziehbarkeit/Re-Parsing
  occurred_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists behavior_events_household_idx on behavior_events (household_id, occurred_at desc);
create index if not exists behavior_events_dog_idx on behavior_events (dog_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Helper: ist der aktuelle Nutzer Mitglied eines Haushalts?
-- ---------------------------------------------------------------------------
create or replace function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row-Level-Security aktivieren
-- ---------------------------------------------------------------------------
alter table households enable row level security;
alter table household_members enable row level security;
alter table dogs enable row level security;
alter table behavior_events enable row level security;

-- households: sehen/ändern nur, wer Mitglied ist
create policy "households: select own" on households
  for select using (is_household_member(id));

create policy "households: insert by creator" on households
  for insert with check (created_by = auth.uid());

create policy "households: update by owner" on households
  for update using (
    exists (
      select 1 from household_members
      where household_id = id and user_id = auth.uid() and role = 'owner'
    )
  );

-- household_members: eigene Mitgliedschaften sehen, Beitritt per Invite-Code über RPC (unten)
create policy "household_members: select own household" on household_members
  for select using (is_household_member(household_id));

create policy "household_members: owner manages members" on household_members
  for delete using (
    exists (
      select 1 from household_members hm
      where hm.household_id = household_members.household_id
        and hm.user_id = auth.uid() and hm.role = 'owner'
    )
  );

-- dogs: alle Mitglieder eines Haushalts sehen/bearbeiten die Hunde des Haushalts
create policy "dogs: select within household" on dogs
  for select using (is_household_member(household_id));

create policy "dogs: insert within household" on dogs
  for insert with check (is_household_member(household_id));

create policy "dogs: update within household" on dogs
  for update using (is_household_member(household_id));

create policy "dogs: delete within household" on dogs
  for delete using (is_household_member(household_id));

-- behavior_events: alle Mitglieder eines Haushalts sehen/bearbeiten die Einträge des Haushalts
create policy "events: select within household" on behavior_events
  for select using (is_household_member(household_id));

create policy "events: insert within household" on behavior_events
  for insert with check (is_household_member(household_id) and created_by = auth.uid());

create policy "events: update within household" on behavior_events
  for update using (is_household_member(household_id));

create policy "events: delete within household" on behavior_events
  for delete using (is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Trigger: bei Registrierung automatisch einen eigenen Haushalt anlegen
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  new_household_id uuid;
begin
  insert into households (name, created_by)
  values ('Mein Haushalt', new.id)
  returning id into new_household_id;

  insert into household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC: einem Haushalt per Invite-Code beitreten (z.B. dein Freund tritt bei)
-- ---------------------------------------------------------------------------
create or replace function join_household_by_invite_code(code text)
returns uuid
language plpgsql
security definer
as $$
declare
  target_household_id uuid;
begin
  select id into target_household_id from households where invite_code = code;

  if target_household_id is null then
    raise exception 'Ungültiger Einladungscode';
  end if;

  insert into household_members (household_id, user_id, role)
  values (target_household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return target_household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: Bucket für Hundefotos (im Dashboard unter Storage prüfen/anlegen)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

create policy "dog-photos: authenticated upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dog-photos');

create policy "dog-photos: public read" on storage.objects
  for select using (bucket_id = 'dog-photos');
