-- Update 4: Stabdaten (Anlauf und Griffhöhe), von den Athletinnen selbst erfasst
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run (einmalig)

create table if not exists public.runups (
  id bigint generated always as identity primary key,
  athlete text not null references public.athletes(name) on update cascade on delete cascade,
  date date not null,
  steps smallint not null check (steps between 1 and 30),                 -- Anlauf in Schritten
  runup_m numeric(5,2) check (runup_m is null or runup_m between 1 and 60), -- Anlauflänge in m
  grip_m numeric(4,2) check (grip_m is null or grip_m between 1 and 6),    -- Griffhöhe in m
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists runups_athlete_date on public.runups (athlete, date);

alter table public.runups enable row level security;
revoke all on public.runups from anon, authenticated;
grant all on public.runups to service_role;
