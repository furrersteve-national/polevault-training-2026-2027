import 'server-only';
import { enc, rest } from '@/lib/db';
import type { Entry } from './lib';

export async function entriesFor(athlete: string): Promise<Entry[]> {
  const rows = await rest<Entry[]>(`entries?select=date,exercise,value&athlete=eq.${enc(athlete)}&order=date.asc`);
  return rows.map((r) => ({ ...r, value: Number(r.value) }));
}

export async function allEntries(): Promise<Entry[]> {
  const rows = await rest<Entry[]>('entries?select=id,athlete,date,exercise,value&order=date.asc,athlete.asc');
  return rows.map((r) => ({ ...r, value: Number(r.value) }));
}
