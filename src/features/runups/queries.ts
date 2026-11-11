import 'server-only';
import { enc, restOr } from '@/lib/db';
import type { Runup, RunupHistoryRow } from './lib';

const FIELDS = 'id,athlete,date,steps,runup_m,grip_m,note,updated_at';

const normalize = (rows: Runup[]) =>
  rows.map((r) => ({
    ...r,
    steps: Number(r.steps),
    runup_m: r.runup_m === null ? null : Number(r.runup_m),
    grip_m: r.grip_m === null ? null : Number(r.grip_m),
  }));

export async function runupsFor(athlete: string): Promise<Runup[]> {
  return normalize(await restOr<Runup[]>(`runups?select=${FIELDS}&athlete=eq.${enc(athlete)}&order=steps.asc`, []));
}

export async function allRunups(): Promise<Runup[]> {
  return normalize(await restOr<Runup[]>(`runups?select=${FIELDS}&order=athlete.asc,steps.asc`, []));
}

/** Verlauf aller Karten einer Athletin, neueste zuerst */
export async function runupHistoryFor(athlete: string): Promise<RunupHistoryRow[]> {
  const rows = await restOr<RunupHistoryRow[]>(
    `runup_history?select=id,athlete,steps,date,runup_m,grip_m,note,created_at&athlete=eq.${enc(athlete)}&order=created_at.desc,id.desc`,
    [],
  );
  return rows.map((r) => ({
    ...r,
    steps: Number(r.steps),
    runup_m: r.runup_m === null ? null : Number(r.runup_m),
    grip_m: r.grip_m === null ? null : Number(r.grip_m),
  }));
}
