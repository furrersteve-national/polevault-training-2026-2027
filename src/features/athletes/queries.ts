import 'server-only';
import { enc, rest } from '@/lib/db';

export type Athlete = { name: string; active: boolean };

export async function listAthletes({ all = false } = {}): Promise<Athlete[]> {
  return rest<Athlete[]>(`athletes?select=name,active${all ? '' : '&active=eq.true'}&order=name.asc`);
}

export async function isActiveAthlete(name: string): Promise<boolean> {
  if (!name) return false;
  const rows = await rest<Athlete[]>(`athletes?select=name&active=eq.true&name=eq.${enc(name)}`);
  return rows.length > 0;
}
