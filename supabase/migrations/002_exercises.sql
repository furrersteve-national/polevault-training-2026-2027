-- Update: Übungen in der Datenbank verwalten
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run (einmalig)

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
