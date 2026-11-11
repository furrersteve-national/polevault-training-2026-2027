'use server';

import { revalidatePath } from 'next/cache';
import { getAthlete, isTrainer, requireAthlete } from '@/lib/auth';
import { enc, rest } from '@/lib/db';
import { fail, run } from '@/lib/actions';
import { todayZurich } from '@/lib/dates';
import { isActiveAthlete } from '@/features/athletes/queries';
import { parseNum, validateRunup, type RunupInput } from './lib';

function refresh() {
  revalidatePath('/stabdaten');
  revalidatePath('/trainer/stabdaten');
}

/** Athletin speichert eine Stabdaten-Karte. Ohne id: neu (oder vorhandene gleiche Schrittzahl überschreiben). */
export async function saveRunup(input: RunupInput, id?: number) {
  return run(async () => {
    const athlete = await requireAthlete();
    if (!(await isActiveAthlete(athlete))) fail('Dein Name ist nicht mehr aktiv. Bitte beim Trainer melden.');
    const errors = validateRunup(input);
    const first = Object.values(errors)[0];
    if (first) fail(first);
    const row = {
      steps: parseNum(input.steps)!,
      runup_m: parseNum(input.runup_m),
      grip_m: parseNum(input.grip_m),
      note: input.note.trim(),
      date: todayZurich(),
      updated_at: new Date().toISOString(),
    };

    if (id) {
      if (!Number.isInteger(id)) fail('Ungültiger Eintrag.');
      const clash = await rest<{ id: number }[]>(`runups?select=id&athlete=eq.${enc(athlete)}&steps=eq.${row.steps}&id=neq.${id}`);
      if (clash.length) fail(`Für ${row.steps} Schritte gibt es schon eine Karte. Bitte dort bearbeiten.`);
      const updated = await rest<unknown[]>(`runups?id=eq.${id}&athlete=eq.${enc(athlete)}`, {
        method: 'PATCH',
        body: row,
        prefer: 'return=representation',
      });
      if (!updated.length) fail('Eintrag nicht gefunden.');
    } else {
      await rest('runups?on_conflict=athlete,steps', {
        method: 'POST',
        body: { ...row, athlete },
        prefer: 'resolution=merge-duplicates,return=minimal',
      });
    }
    refresh();
  }, 'Gespeichert ✓');
}

/** Löschen: Athletin nur eigene Karten, Trainer alle. */
export async function deleteRunup(id: number) {
  return run(async () => {
    if (!Number.isInteger(id)) fail('Ungültiger Eintrag.');
    const trainer = await isTrainer();
    const athlete = trainer ? null : await getAthlete();
    if (!trainer && !athlete) fail('Bitte zuerst anmelden.', 401);
    const filter = athlete ? `&athlete=eq.${enc(athlete)}` : '';
    const deleted = await rest<{ athlete: string; steps: number }[]>(`runups?id=eq.${id}${filter}`, { method: 'DELETE', prefer: 'return=representation' });
    if (!deleted.length) fail('Eintrag nicht gefunden.');
    // Verlauf dieser Karte ebenfalls entfernen
    await rest(`runup_history?athlete=eq.${enc(deleted[0].athlete)}&steps=eq.${deleted[0].steps}`, { method: 'DELETE', prefer: 'return=minimal' });
    refresh();
  }, 'Karte gelöscht.');
}
