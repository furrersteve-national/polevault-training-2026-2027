-- Update 5: Stabdaten als Karten (ein Eintrag pro Schrittzahl) und Trainingstagebuch
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run (einmalig)

-- Stabdaten: pro Athletin und Schrittzahl genau ein Eintrag, der bearbeitet wird
delete from public.runups a using public.runups b
  where a.athlete = b.athlete and a.steps = b.steps and (a.date, a.id) < (b.date, b.id);
alter table public.runups alter column date set default current_date;
alter table public.runups add column if not exists updated_at timestamptz not null default now();
do $$ begin
  alter table public.runups add constraint runups_athlete_steps unique (athlete, steps);
exception when duplicate_table or duplicate_object then null; end $$;

-- Trainingstagebuch: ein Eintrag pro Athletin und Training. Privat, ausser die Athletin gibt ihn frei.
create table if not exists public.diary_entries (
  id bigint generated always as identity primary key,
  athlete text not null references public.athletes(name) on update cascade on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  date date not null,
  text text not null default '' check (char_length(text) <= 5000),
  audio_path text,
  audio_mime text,
  audio_seconds int check (audio_seconds is null or audio_seconds between 0 and 900),
  shared boolean not null default false,  -- für den Trainer freigegeben
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete, session_id)
);
create index if not exists diary_session on public.diary_entries (session_id);

alter table public.diary_entries enable row level security;
revoke all on public.diary_entries from anon, authenticated;
grant all on public.diary_entries to service_role;

-- Privater Speicher für Sprachaufnahmen (max. 15 MB pro Datei)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diary', 'diary', false, 15728640,
        array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/wav'])
on conflict (id) do nothing;
