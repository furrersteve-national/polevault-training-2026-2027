import 'server-only';
import { enc, restOr } from '@/lib/db';
import type { Session } from './types';

const FIELDS = 'id,date,start_time,end_time,end_time_late,phase,coach,content,location,status,note';

export async function listSessions({ from, to }: { from?: string; to?: string } = {}): Promise<Session[]> {
  const filters = [from ? `date=gte.${from}` : '', to ? `date=lte.${to}` : ''].filter(Boolean).join('&');
  return restOr<Session[]>(`sessions?select=${FIELDS}${filters ? `&${filters}` : ''}&order=date.asc,start_time.asc`, []);
}

export async function getSession(id: string): Promise<Session | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await restOr<Session[]>(`sessions?select=${FIELDS}&id=eq.${enc(id)}`, []);
  return rows[0] ?? null;
}
