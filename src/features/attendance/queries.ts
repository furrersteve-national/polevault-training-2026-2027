import 'server-only';
import { enc, inList, restOr } from '@/lib/db';
import type { Presence, Rsvp } from './lib';

export async function rsvpsFor(sessionIds: string[]): Promise<Rsvp[]> {
  if (!sessionIds.length) return [];
  return restOr<Rsvp[]>(`rsvps?select=session_id,athlete,status,reason,updated_at&session_id=in.${enc(inList(sessionIds))}`, []);
}

export async function rsvpsOfAthlete(athlete: string): Promise<Rsvp[]> {
  return restOr<Rsvp[]>(`rsvps?select=session_id,athlete,status,reason&athlete=eq.${enc(athlete)}`, []);
}

export async function presenceFor(sessionIds: string[]): Promise<Presence[]> {
  if (!sessionIds.length) return [];
  return restOr<Presence[]>(`attendance?select=session_id,athlete,present&session_id=in.${enc(inList(sessionIds))}`, []);
}
