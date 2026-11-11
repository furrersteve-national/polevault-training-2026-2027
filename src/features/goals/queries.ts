import 'server-only';
import { enc, restOr } from '@/lib/db';
import type { Goal } from './types';

const FIELDS = 'id,athlete,text,done,created_by,updated_by,created_at,updated_at,done_at';

/** Ziele einer Athletin: offene zuerst (älteste oben), dann erreichte (neueste oben) */
export async function goalsFor(athlete: string): Promise<Goal[]> {
  const rows = await restOr<Goal[]>(`goals?select=${FIELDS}&athlete=eq.${enc(athlete)}&order=done.asc,created_at.asc`, []);
  return sortGoals(rows);
}

export async function allGoals(): Promise<Goal[]> {
  return sortGoals(await restOr<Goal[]>(`goals?select=${FIELDS}&order=athlete.asc,done.asc,created_at.asc`, []));
}

function sortGoals(rows: Goal[]) {
  const open = rows.filter((g) => !g.done);
  const done = rows.filter((g) => g.done).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''));
  return [...open, ...done];
}
