-- Update 3: Trainingsplan, An-/Abmeldung und Anwesenheit
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run (einmalig)

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time,
  end_time time,
  end_time_late time,              -- z. B. "20:00 – 21:30 / 22:00"
  phase text not null default '',  -- z. B. "Technikaufbau"
  coach text not null default '',
  content text not null default '',
  location text not null default '',
  status text not null default 'planned' check (status in ('planned', 'cancelled')),
  note text not null default '',   -- z. B. Grund für Ausfall
  created_at timestamptz not null default now()
);
create index if not exists sessions_date on public.sessions (date);

-- An-/Abmeldung. Keine Zeile = angemeldet (Standard).
create table if not exists public.rsvps (
  session_id uuid not null references public.sessions(id) on delete cascade,
  athlete text not null references public.athletes(name) on update cascade on delete cascade,
  status text not null check (status in ('yes', 'no')),
  reason text not null default '',
  updated_at timestamptz not null default now(),
  primary key (session_id, athlete)
);

-- Effektive Anwesenheit, vom Trainer erfasst.
create table if not exists public.attendance (
  session_id uuid not null references public.sessions(id) on delete cascade,
  athlete text not null references public.athletes(name) on update cascade on delete cascade,
  present boolean not null,
  updated_at timestamptz not null default now(),
  primary key (session_id, athlete)
);

alter table public.sessions enable row level security;
alter table public.rsvps enable row level security;
alter table public.attendance enable row level security;
revoke all on public.sessions, public.rsvps, public.attendance from anon, authenticated;
grant all on public.sessions, public.rsvps, public.attendance to service_role;

-- Aktueller Plan (Stand November 2026)
insert into public.sessions (date, start_time, end_time, end_time_late, phase, coach, content, location, status, note)
select * from (values
  ('2026-11-11'::date, '20:00'::time, '21:30'::time, '22:00'::time, 'Technikaufbau', 'Steve', 'Anlauf, Einstich, Techniktraining', 'Dürrbach', 'planned', ''),
  ('2026-11-18'::date, null, null, null, 'Technikaufbau', '', '', '', 'cancelled', 'Kein Stabhochsprungtraining, Chränzli Hauptprobe'),
  ('2026-11-25'::date, null, null, null, 'Technikaufbau', '', '', '', 'cancelled', 'Kein Stabhochsprungtraining'),
  ('2026-12-02'::date, null, null, null, 'Technikaufbau', '', '', '', 'cancelled', 'Kein Stabhochsprungtraining'),
  ('2026-12-09'::date, null, null, null, 'Technikaufbau', '', '', '', 'cancelled', 'Kein Stabhochsprungtraining'),
  ('2026-12-16'::date, '20:00'::time, '21:30'::time, '22:00'::time, 'Technikaufbau', 'Steve', 'Anlauf, Einstich, Techniktraining', 'Dürrbach', 'planned', ''),
  ('2026-12-23'::date, '20:00'::time, '21:30'::time, '22:00'::time, 'Technikaufbau', 'Steve', 'Anlauf, Einstich, Techniktraining', 'Dürrbach', 'planned', '')
) as v(date, start_time, end_time, end_time_late, phase, coach, content, location, status, note)
where not exists (select 1 from public.sessions);
