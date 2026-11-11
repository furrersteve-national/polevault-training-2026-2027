'use server';

import { revalidatePath } from 'next/cache';
import { getAthlete, isTrainer, requireAthlete } from '@/lib/auth';
import { enc, rest } from '@/lib/db';
import { fail, run } from '@/lib/actions';
import { daysBetween, todayZurich } from '@/lib/dates';
import { isActiveAthlete } from '@/features/athletes/queries';
import { parseNum, validateRunup, type RunupInput } from './lib';

function rowFrom(input: RunupInput) {
  const errors = validateRunup(input);
  const first = Object.values(errors)[0];
  if (first) fail(first);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) fail('Bitte ein gültiges Datum wählen.');
  if (daysBetween(todayZurich(), input.date) > 1) fail('Das Datum liegt in der Zukunft.');
  if (input.date < '2020-01-01') fail('Das Datum ist zu alt.');
  return {
    date: input.date,
    steps: parseNum(input.steps)!,
    runup_m: parseNum(input.runup_m),
    grip_m: parseNum(input.grip_m),
    note: input.note.trim(),
  };
}

function refresh() {
  revalidatePath('/stabdaten');
  revalidatePath('/trainer/stabdaten');
}

/** Athletin erfasst einen Anlauf (neu) oder korrigiert einen eigenen (id gesetzt). */
export async function saveRunup(input: RunupInput, id?: number) {
  return run(async () => {
    const athlete = await requireAthlete();
    if (!(await isActiveAthlete(athlete))) fail('Dein Name ist nicht mehr aktiv. Bitte beim Trainer melden.');
    const row = rowFrom(input);
    if (id) {
      if (!Number.isInteger(id)) fail('Ungültiger Eintrag.');
      const updated = await rest<unknown[]>(`runups?id=eq.${id}&athlete=eq.${enc(athlete)}`, {
        method: 'PATCH',
        body: row,
        prefer: 'return=representation',
      });
      if (!updated.length) fail('Eintrag nicht gefunden.');
    } else {
      await rest('runups', { method: 'POST', body: { ...row, athlete }, prefer: 'return=minimal' });
    }
    refresh();
  }, id ? 'Änderung gespeichert ✓' : 'Anlauf gespeichert ✓');
}

/** Löschen: Athletin nur eigene Einträge, Trainer alle. */
export async function deleteRunup(id: number) {
  return run(async () => {
    if (!Number.isInteger(id)) fail('Ungültiger Eintrag.');
    const trainer = await isTrainer();
    const athlete = trainer ? null : await getAthlete();
    if (!trainer && !athlete) fail('Bitte zuerst anmelden.', 401);
    const filter = athlete ? `&athlete=eq.${enc(athlete)}` : '';
    const deleted = await rest<unknown[]>(`runups?id=eq.${id}${filter}`, { method: 'DELETE', prefer: 'return=representation' });
    if (!deleted.length) fail('Eintrag nicht gefunden.');
    refresh();
  }, 'Eintrag gelöscht.');
}
