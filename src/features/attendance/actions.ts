'use server';

import { revalidatePath } from 'next/cache';
import { requireAthlete, requireTrainer } from '@/lib/auth';
import { enc, rest } from '@/lib/db';
import { fail, run } from '@/lib/actions';
import { isActiveAthlete, listAthletes } from '@/features/athletes/queries';
import { getSession } from '@/features/sessions/queries';
import { rsvpLocked } from '@/features/sessions/types';
import { buildRoster, type RsvpStatus } from './lib';
import { presenceFor, rsvpsFor } from './queries';

/** Athlet/in meldet sich für ein Training an oder ab (bis Trainingsbeginn). */
export async function setRsvp(sessionId: string, status: RsvpStatus, reason = '') {
  return run(async () => {
    const athlete = await requireAthlete();
    if (!(await isActiveAthlete(athlete))) fail('Dein Name ist nicht mehr aktiv. Bitte beim Trainer melden.');
    const session = await getSession(sessionId);
    if (!session) fail('Dieses Training gibt es nicht mehr.');
    if (session.status === 'cancelled') fail('Dieses Training fällt aus.');
    if (rsvpLocked(session)) fail('Das Training hat schon begonnen. An- und Abmelden ist nicht mehr möglich – bitte melde dich direkt beim Trainer.');
    if (status !== 'yes' && status !== 'no') fail('Ungültiger Status.');
    await rest('rsvps?on_conflict=session_id,athlete', {
      method: 'POST',
      body: [{ session_id: sessionId, athlete, status, reason: status === 'no' ? reason.trim().slice(0, 200) : '', updated_at: new Date().toISOString() }],
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    revalidatePath('/');
  }, status === 'yes' ? 'Du bist angemeldet.' : 'Du bist abgemeldet.');
}

/** Trainer: Anwesenheit einer Person setzen (true/false) oder zurücksetzen (null). */
export async function setPresence(sessionId: string, athlete: string, present: boolean | null) {
  return run(async () => {
    await requireTrainer();
    if (present === null) {
      await rest(`attendance?session_id=eq.${enc(sessionId)}&athlete=eq.${enc(athlete)}`, { method: 'DELETE', prefer: 'return=minimal' });
    } else {
      await rest('attendance?on_conflict=session_id,athlete', {
        method: 'POST',
        body: [{ session_id: sessionId, athlete, present, updated_at: new Date().toISOString() }],
        prefer: 'resolution=merge-duplicates,return=minimal',
      });
    }
    revalidatePath('/trainer', 'layout');
  });
}

/** Trainer: Alle Angemeldeten als anwesend, alle Abgemeldeten als abwesend markieren (nur noch nicht erfasste). */
export async function markAsRegistered(sessionId: string) {
  return run(async () => {
    await requireTrainer();
    const [athletes, rsvps, presence] = await Promise.all([listAthletes(), rsvpsFor([sessionId]), presenceFor([sessionId])]);
    const roster = buildRoster(sessionId, athletes.map((a) => a.name), rsvps, presence);
    const rows = roster
      .filter((r) => r.present === null)
      .map((r) => ({ session_id: sessionId, athlete: r.athlete, present: r.rsvp === 'yes', updated_at: new Date().toISOString() }));
    if (rows.length) {
      await rest('attendance?on_conflict=session_id,athlete', { method: 'POST', body: rows, prefer: 'resolution=merge-duplicates,return=minimal' });
    }
    revalidatePath('/trainer', 'layout');
    return rows.length;
  });
}
