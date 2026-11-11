-- Update 7: Ziele / Fokusthemen pro Athletin. Vom Trainer gesetzt, von der Athletin bearbeitbar.
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run (einmalig)

create table if not exists public.goals (
  id bigint generated always as identity primary key,
  athlete text not null references public.athletes(name) on update cascade on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  done boolean not null default false,
  created_by text not null default 'trainer' check (created_by in ('trainer', 'athlete')),
  updated_by text not null default 'trainer' check (updated_by in ('trainer', 'athlete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists goals_athlete on public.goals (athlete, done, created_at);

alter table public.goals enable row level security;
revoke all on public.goals from anon, authenticated;
grant all on public.goals to service_role;
