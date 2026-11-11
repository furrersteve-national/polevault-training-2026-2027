'use server';

import { revalidatePath } from 'next/cache';
import { requireAthlete, requireTrainer } from '@/lib/auth';
import { enc, rest } from '@/lib/db';
import { fail, run } from '@/lib/actions';
import { daysBetween, todayZurich } from '@/lib/dates';
import { isActiveAthlete } from '@/features/athletes/queries';
import { loadExercises } from '@/features/exercises/queries';

function parseValue(raw: string): number | null {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (s === '') return null;
  if (!/^\d+(\.\d+)?$/.test(s)) fail(`Ungültige Zahl: «${raw}». Bitte nur Zahlen eintragen, z. B. 12 oder 7,5.`);
  const n = Number(s);
  if (!Number.isFinite(n) || n > 100000) fail(`Ungültige Zahl: «${raw}».`);
  return n;
}

function checkDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('Bitte ein gültiges Datum wählen.');
  if (daysBetween(todayZurich(), date) > 1) fail('Das Datum liegt in der Zukunft.');
  if (date < '2020-01-01') fail('Das Datum ist zu alt.');
}

/** Resultate der angemeldeten Person speichern. Gleicher Tag + Übung wird überschrieben. */
export async function saveResults(date: string, values: Record<string, string>) {
  return run(async () => {
    const athlete = await requireAthlete();
    if (!(await isActiveAthlete(athlete))) fail('Dein Name ist nicht mehr aktiv. Bitte bei den Trainer:innen melden.');
    checkDate(date);
    const keys = new Set((await loadExercises()).map((e) => e.key));
    const rows: { athlete: string; date: string; exercise: string; value: number }[] = [];
    for (const [key, raw] of Object.entries(values)) {
      if (!keys.has(key)) continue;
      const value = parseValue(raw);
      if (value !== null) rows.push({ athlete, date, exercise: key, value });
    }
    if (!rows.length) fail('Bitte mindestens ein Resultat eintragen.');
    await rest('entries?on_conflict=athlete,date,exercise', {
      method: 'POST',
      body: rows,
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    revalidatePath('/resultate');
    return rows.length;
  });
}

/** Trainer: alle Werte einer Person an einem Tag löschen */
export async function deleteResultsDay(athlete: string, date: string) {
  return run(async () => {
    await requireTrainer();
    checkDate(date);
    await rest(`entries?athlete=eq.${enc(athlete)}&date=eq.${date}`, { method: 'DELETE', prefer: 'return=minimal' });
    revalidatePath('/trainer/resultate');
  }, 'Einträge gelöscht.');
}
