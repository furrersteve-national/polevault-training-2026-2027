'use server';

import { revalidatePath } from 'next/cache';
import { requireTrainer } from '@/lib/auth';
import { enc, rest } from '@/lib/db';
import { fail, run } from '@/lib/actions';

type ExerciseInput = { label: string; unit: string; hint: string };

function clean(input: ExerciseInput) {
  const label = String(input.label || '').trim();
  const unit = String(input.unit || '').trim();
  const hint = String(input.hint || '').trim();
  if (!label || label.length > 60) fail('Bitte einen Namen für die Übung eingeben (max. 60 Zeichen).');
  if (!unit || unit.length > 10) fail('Bitte eine Einheit eingeben, z. B. Stk, Sek, m (max. 10 Zeichen).');
  if (hint.length > 300) fail('Die Beschreibung ist zu lang (max. 300 Zeichen).');
  return { label, unit, hint };
}

/** "Käferlaufen" -> "kaeferlaufen" (stabiler Schlüssel, ändert sich nie mehr) */
function makeKey(label: string, existing: Set<string>) {
  const base =
    label
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'uebung';
  let key = base;
  for (let n = 2; existing.has(key); n++) key = `${base}_${n}`;
  return key;
}

const rows = () => rest<{ key: string; sort: number }[]>('exercises?select=key,sort&order=sort.asc,label.asc');
const done = () => revalidatePath('/', 'layout');

export async function addExercise(input: ExerciseInput) {
  return run(async () => {
    await requireTrainer();
    const ex = clean(input);
    const all = await rows();
    const key = makeKey(ex.label, new Set(all.map((r) => r.key)));
    const sort = all.reduce((m, r) => Math.max(m, r.sort || 0), 0) + 10;
    await rest('exercises', { method: 'POST', body: [{ key, ...ex, sort, active: true }], prefer: 'return=minimal' });
    done();
  }, `Übung «${input.label.trim()}» hinzugefügt.`);
}

export async function updateExercise(key: string, input: ExerciseInput) {
  return run(async () => {
    await requireTrainer();
    await rest(`exercises?key=eq.${enc(key)}`, { method: 'PATCH', body: clean(input), prefer: 'return=minimal' });
    done();
  }, 'Übung gespeichert.');
}

export async function setExerciseActive(key: string, active: boolean) {
  return run(async () => {
    await requireTrainer();
    await rest(`exercises?key=eq.${enc(key)}`, { method: 'PATCH', body: { active }, prefer: 'return=minimal' });
    done();
  }, active ? 'Übung wieder eingeblendet.' : 'Übung ausgeblendet. Die Daten bleiben erhalten.');
}

export async function moveExercise(key: string, dir: 'up' | 'down') {
  return run(async () => {
    await requireTrainer();
    const list = await rows();
    const i = list.findIndex((r) => r.key === key);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await Promise.all(
      list.map((r, idx) =>
        (idx + 1) * 10 !== r.sort
          ? rest(`exercises?key=eq.${enc(r.key)}`, { method: 'PATCH', body: { sort: (idx + 1) * 10 }, prefer: 'return=minimal' })
          : null,
      ),
    );
    done();
  });
}

export async function deleteExercise(key: string) {
  return run(async () => {
    await requireTrainer();
    const used = await rest<unknown[]>(`entries?select=id&exercise=eq.${enc(key)}&limit=1`);
    if (used.length) fail('Zu dieser Übung gibt es schon Einträge. Blende sie stattdessen aus – so bleiben die Daten erhalten.');
    await rest(`exercises?key=eq.${enc(key)}`, { method: 'DELETE', prefer: 'return=minimal' });
    done();
  }, 'Übung gelöscht.');
}
