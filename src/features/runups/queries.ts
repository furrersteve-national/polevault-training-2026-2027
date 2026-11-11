import 'server-only';
import { enc, restOr } from '@/lib/db';
import type { Runup } from './lib';

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
