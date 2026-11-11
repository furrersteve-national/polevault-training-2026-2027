-- Update 6: Verlauf (Historie) pro Anlauf. Jede Änderung einer Stabdaten-Karte wird automatisch festgehalten.
-- In Supabase: SQL Editor -> New query -> alles einfügen -> Run (einmalig)

create table if not exists public.runup_history (
  id bigint generated always as identity primary key,
  athlete text not null references public.athletes(name) on update cascade on delete cascade,
  steps smallint not null,
  date date not null,
  runup_m numeric(5,2),
  grip_m numeric(4,2),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists runup_history_lookup on public.runup_history (athlete, steps, created_at desc);

alter table public.runup_history enable row level security;
revoke all on public.runup_history from anon, authenticated;
grant all on public.runup_history to service_role;

create or replace function public.log_runup_history() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE'
     and new.steps = old.steps
     and new.runup_m is not distinct from old.runup_m
     and new.grip_m is not distinct from old.grip_m
     and new.note = old.note then
    return new; -- nichts geändert
  end if;
  insert into public.runup_history (athlete, steps, date, runup_m, grip_m, note)
  values (new.athlete, new.steps, new.date, new.runup_m, new.grip_m, new.note);
  return new;
end $$;

drop trigger if exists runups_history on public.runups;
create trigger runups_history after insert or update on public.runups
  for each row execute function public.log_runup_history();

-- Bestehende Karten als ersten Verlaufseintrag übernehmen
insert into public.runup_history (athlete, steps, date, runup_m, grip_m, note, created_at)
select r.athlete, r.steps, r.date, r.runup_m, r.grip_m, r.note, r.updated_at
from public.runups r
where not exists (select 1 from public.runup_history h where h.athlete = r.athlete and h.steps = r.steps);
