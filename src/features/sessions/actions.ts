'use server';

import { revalidatePath } from 'next/cache';
import { requireTrainer } from '@/lib/auth';
import { enc, rest } from '@/lib/db';
import { fail, run } from '@/lib/actions';
import type { SessionInput } from './types';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function clean(input: SessionInput): SessionInput {
  const t = (v: string | null) => {
    const s = String(v ?? '').trim().replace('.', ':');
    if (!s) return null;
    const norm = s.length === 4 ? `0${s}` : s; // 9:30 -> 09:30
    if (!TIME.test(norm)) fail(`Ungültige Uhrzeit: «${v}». Format z. B. 20:00.`);
    return norm;
  };
  const str = (v: string, max: number, label: string) => {
    const s = String(v ?? '').trim();
    if (s.length > max) fail(`${label} ist zu lang (max. ${max} Zeichen).`);
    return s;
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) fail('Bitte ein gültiges Datum wählen.');
  const status = input.status === 'cancelled' ? 'cancelled' : 'planned';
  const start_time = t(input.start_time);
  const end_time = t(input.end_time);
  const end_time_late = t(input.end_time_late);
  if (status === 'planned' && !start_time) fail('Bitte eine Startzeit angeben.');
  if (start_time && end_time && end_time <= start_time) fail('Das Ende muss nach dem Beginn liegen.');
  return {
    date: input.date,
    start_time,
    end_time,
    end_time_late,
    phase: str(input.phase, 60, 'Die Phase'),
    coach: str(input.coach, 60, 'Der Trainer-Name'),
    content: str(input.content, 300, 'Der Inhalt'),
    location: str(input.location, 80, 'Der Ort'),
    status,
    note: str(input.note, 200, 'Die Bemerkung'),
  };
}

const done = () => revalidatePath('/', 'layout');

export async function createSession(input: SessionInput) {
  return run(async () => {
    await requireTrainer();
    const rows = await rest<{ id: string }[]>('sessions?select=id', {
      method: 'POST',
      body: [clean(input)],
      prefer: 'return=representation',
    });
    done();
    return rows[0]?.id;
  }, 'Training erstellt.');
}

export async function updateSession(id: string, input: SessionInput) {
  return run(async () => {
    await requireTrainer();
    await rest(`sessions?id=eq.${enc(id)}`, { method: 'PATCH', body: clean(input), prefer: 'return=minimal' });
    done();
  }, 'Training gespeichert.');
}

export async function setSessionCancelled(id: string, cancelled: boolean, note = '') {
  return run(async () => {
    await requireTrainer();
    const body = cancelled ? { status: 'cancelled', note: note.trim().slice(0, 200) } : { status: 'planned', note: '' };
    await rest(`sessions?id=eq.${enc(id)}`, { method: 'PATCH', body, prefer: 'return=minimal' });
    done();
  }, cancelled ? 'Training abgesagt.' : 'Training findet wieder statt.');
}

export async function deleteSession(id: string) {
  return run(async () => {
    await requireTrainer();
    await rest(`sessions?id=eq.${enc(id)}`, { method: 'DELETE', prefer: 'return=minimal' });
    done();
  }, 'Training gelöscht.');
}
