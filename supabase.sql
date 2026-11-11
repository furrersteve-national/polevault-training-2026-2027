-- Stabhochsprung Trainingsportal: Tabellen anlegen
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run

create table if not exists public.athletes (
  name text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id bigint generated always as identity primary key,
  athlete text not null references public.athletes(name) on update cascade on delete cascade,
  date date not null,
  exercise text not null,
  value numeric not null check (value >= 0),
  created_at timestamptz not null default now(),
  unique (athlete, date, exercise)
);

create index if not exists entries_athlete_date on public.entries (athlete, date);

-- Zugriff nur über den Server (geheimer Schlüssel). Öffentliche Schlüssel sehen nichts.
alter table public.athletes enable row level security;
alter table public.entries enable row level security;
revoke all on public.athletes, public.entries from anon, authenticated;
grant all on public.athletes, public.entries to service_role;

insert into public.athletes (name) values
  ('Svea'), ('Nina'), ('Alana'), ('Jonas'), ('Paul'), ('Nikola'), ('Luis')
on conflict (name) do nothing;
