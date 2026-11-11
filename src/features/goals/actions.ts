'use server';

import { revalidatePath } from 'next/cache';
import { getAthlete, isTrainer } from '@/lib/auth';
import { enc, rest } from '@/lib/db';
import { fail, run } from '@/lib/actions';
import { isActiveAthlete, listAthletes } from '@/features/athletes/queries';
import { MAX_GOAL } from './types';

/**
 * Wer handelt? Mit `forAthlete` handelt der Trainer für diese Athletin,
 * ohne handelt die angemeldete Athletin für sich selbst.
 */
async function actor(forAthlete?: string) {
  if (forAthlete !== undefined) {
    if (!(await isTrainer())) fail('Bitte als Trainer:in anmelden.', 401);
    if (!(await isActiveAthlete(forAthlete))) fail('Athlet:in nicht gefunden.');
    return { athlete: forAthlete, by: 'trainer' as const };
  }
  const athlete = await getAthlete();
  if (!athlete) fail('Bitte zuerst anmelden.', 401);
  if (!(await isActiveAthlete(athlete))) fail('Dein Name ist nicht mehr aktiv. Bitte bei den Trainer:innen melden.');
  return { athlete, by: 'athlete' as const };
}

function cleanText(raw: string) {
  const text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!text) fail('Bitte ein Ziel eintragen.');
  if (text.length > MAX_GOAL) fail(`Höchstens ${MAX_GOAL} Zeichen.`);
  return text;
}

const checkId = (id: number) => {
  if (!Number.isInteger(id) || id < 1) fail('Ungültiges Ziel.');
};

function refresh() {
  revalidatePath('/');
  revalidatePath('/trainer/ziele');
}

async function patch(id: number, athlete: string, body: Record<string, unknown>) {
  const rows = await rest<unknown[]>(`goals?id=eq.${id}&athlete=eq.${enc(athlete)}`, {
    method: 'PATCH',
    body: { ...body, updated_at: new Date().toISOString() },
    prefer: 'return=representation',
  });
  if (!rows.length) fail('Ziel nicht gefunden.');
}

export async function addGoal(text: string, forAthlete?: string) {
  return run(async () => {
    const { athlete, by } = await actor(forAthlete);
    await rest('goals', { method: 'POST', body: { athlete, text: cleanText(text), created_by: by, updated_by: by }, prefer: 'return=minimal' });
    refresh();
  }, 'Ziel hinzugefügt ✓');
}

/** Trainer: dasselbe Ziel mehreren Athletinnen auf einmal geben */
export async function addGoalForMany(text: string, athletes: string[]) {
  return run(async () => {
    if (!(await isTrainer())) fail('Bitte als Trainer:in anmelden.', 401);
    const value = cleanText(text);
    const active = new Set((await listAthletes()).map((a) => a.name));
    const targets = [...new Set(athletes)].filter((a) => active.has(a));
    if (!targets.length) fail('Bitte mindestens eine Person wählen.');
    await rest('goals', {
      method: 'POST',
      body: targets.map((athlete) => ({ athlete, text: value, created_by: 'trainer', updated_by: 'trainer' })),
      prefer: 'return=minimal',
    });
    refresh();
    return targets.length;
  });
}

export async function updateGoal(id: number, text: string, forAthlete?: string) {
  return run(async () => {
    checkId(id);
    const { athlete, by } = await actor(forAthlete);
    await patch(id, athlete, { text: cleanText(text), updated_by: by });
    refresh();
  }, 'Gespeichert ✓');
}

export async function setGoalDone(id: number, done: boolean, forAthlete?: string) {
  return run(async () => {
    checkId(id);
    const { athlete, by } = await actor(forAthlete);
    await patch(id, athlete, { done, done_at: done ? new Date().toISOString() : null, updated_by: by });
    refresh();
  }, done ? 'Erreicht – stark! 🎉' : 'Wieder offen.');
}

export async function deleteGoal(id: number, forAthlete?: string) {
  return run(async () => {
    checkId(id);
    const { athlete } = await actor(forAthlete);
    const rows = await rest<unknown[]>(`goals?id=eq.${id}&athlete=eq.${enc(athlete)}`, { method: 'DELETE', prefer: 'return=representation' });
    if (!rows.length) fail('Ziel nicht gefunden.');
    refresh();
  }, 'Ziel gelöscht.');
}
