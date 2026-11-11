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

-- Übungen
create table if not exists public.exercises (
  key text primary key,
  label text not null,
  unit text not null default 'Stk',
  hint text not null default '',
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;
revoke all on public.exercises from anon, authenticated;
grant all on public.exercises to service_role;

insert into public.exercises (key, label, unit, hint, sort) values
  ('handstand', 'Handstandlaufen', 'm', 'Strecke im Handstand gehen, ohne umzufallen. In Metern.', 10),
  ('kaefer', 'Käferlaufen', 'Stk', 'Anzahl saubere Wiederholungen am Stück.', 20),
  ('hohlkoerper', 'Hohlkörperhalten', 'Sek', 'Rückenlage, Arme und Beine gestreckt knapp über dem Boden, unterer Rücken am Boden. Zeit in Sekunden.', 30),
  ('klimmzuege', 'Klimmzüge', 'Stk', 'Ristgriff, aus dem gestreckten Hang, Kinn über die Stange, ohne Schwung. Anzahl am Stück.', 40),
  ('liegestuetze', 'Liegestütze', 'Stk', 'Körper gerade wie ein Brett, Brust bis knapp über den Boden. Anzahl am Stück.', 50),
  ('rumpfbeugen', 'Rumpfbeugen sauber', 'Stk', 'Kontrolliert und ohne Schwung. Anzahl am Stück.', 60),
  ('sprossen_gestreckt', 'Sprossenwand: Beine gestreckt an Hände', 'Stk', 'Hang an der Sprossenwand, gestreckte Beine hoch, bis die Füsse die Hände berühren. Anzahl am Stück.', 70),
  ('sprossen_gehockt', 'Sprossenwand: Knie gehockt hoch', 'Stk', 'Hang an der Sprossenwand, Knie so hoch wie möglich zur Brust ziehen. Anzahl am Stück.', 80)
on conflict (key) do nothing;
