'use server';

import { createHmac, randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireAthlete } from '@/lib/auth';
import { enc, rest, supabaseKey } from '@/lib/db';
import { fail, run } from '@/lib/actions';
import { removeObjects, signedUploadUrl } from '@/lib/storage';
import { todayZurich } from '@/lib/dates';
import { isActiveAthlete } from '@/features/athletes/queries';
import { getSession } from '@/features/sessions/queries';
import { AUDIO_TYPES, baseMime, DIARY_BUCKET, MAX_AUDIO_SECONDS, MAX_TEXT, type DiaryEntry } from './types';

/** Ordner pro Athletin – nicht erratbar, damit niemand fremde Aufnahmen verknüpfen kann */
const folderOf = (athlete: string) => createHmac('sha256', `diary:${supabaseKey()}`).update(athlete).digest('hex').slice(0, 20);

async function activeAthlete() {
  const athlete = await requireAthlete();
  if (!(await isActiveAthlete(athlete))) fail('Dein Name ist nicht mehr aktiv. Bitte beim Trainer melden.');
  return athlete;
}

async function openSession(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session) fail('Training nicht gefunden.');
  if (session.status !== 'planned') fail('Dieses Training ist ausgefallen.');
  if (session.date > todayZurich()) fail('Das Tagebuch kannst du ab dem Trainingstag schreiben.');
  return session;
}

async function existing(athlete: string, sessionId: string) {
  const rows = await rest<DiaryEntry[]>(`diary_entries?select=id,audio_path&athlete=eq.${enc(athlete)}&session_id=eq.${enc(sessionId)}`);
  return rows[0] ?? null;
}

/** Schritt 1 einer Sprachaufnahme: Upload-Adresse holen. Der Browser lädt die Datei direkt in den Speicher. */
export async function prepareAudioUpload(mime: string) {
  return run(async () => {
    const athlete = await activeAthlete();
    const type = baseMime(mime);
    const ext = AUDIO_TYPES[type];
    if (!ext) fail('Dieses Aufnahmeformat wird nicht unterstützt.');
    const path = `${folderOf(athlete)}/${randomUUID()}.${ext}`;
    return { path, uploadUrl: await signedUploadUrl(DIARY_BUCKET, path), contentType: type };
  });
}

type SaveInput = {
  sessionId: string;
  text: string;
  shared: boolean;
  /** undefined = Aufnahme unverändert, null = Aufnahme entfernen, Objekt = neue Aufnahme */
  audio?: { path: string; mime: string; seconds: number } | null;
};

/** Tagebucheintrag zu einem Training speichern (neu oder ändern) */
export async function saveDiary(input: SaveInput) {
  return run(async () => {
    const athlete = await activeAthlete();
    const session = await openSession(input.sessionId);
    const text = String(input.text ?? '').trim();
    if (text.length > MAX_TEXT) fail(`Höchstens ${MAX_TEXT} Zeichen.`);

    const before = await existing(athlete, session.id);
    const row: Record<string, unknown> = {
      athlete,
      session_id: session.id,
      date: session.date,
      text,
      shared: Boolean(input.shared),
      updated_at: new Date().toISOString(),
    };

    if (input.audio) {
      const { path, mime, seconds } = input.audio;
      const re = new RegExp(`^${folderOf(athlete)}/[0-9a-f-]{36}\\.(${[...new Set(Object.values(AUDIO_TYPES))].join('|')})$`);
      if (!re.test(path)) fail('Ungültige Aufnahme.');
      if (!AUDIO_TYPES[baseMime(mime)]) fail('Dieses Aufnahmeformat wird nicht unterstützt.');
      Object.assign(row, {
        audio_path: path,
        audio_mime: baseMime(mime),
        audio_seconds: Math.max(0, Math.min(MAX_AUDIO_SECONDS + 30, Math.round(Number(seconds) || 0))),
      });
    } else if (input.audio === null) {
      Object.assign(row, { audio_path: null, audio_mime: null, audio_seconds: null });
    }

    const hasAudio = input.audio ? true : input.audio === null ? false : Boolean(before?.audio_path);
    if (!text && !hasAudio) fail('Bitte etwas schreiben oder eine Sprachnachricht aufnehmen.');

    await rest('diary_entries?on_conflict=athlete,session_id', {
      method: 'POST',
      body: row,
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    if (before?.audio_path && input.audio !== undefined && before.audio_path !== input.audio?.path) {
      await removeObjects(DIARY_BUCKET, [before.audio_path]);
    }
    revalidatePath('/');
    revalidatePath(`/trainer/training/${session.id}`);
    revalidatePath('/trainer/tagebuch');
  }, 'Tagebuch gespeichert ✓');
}

/** Eigenen Tagebucheintrag löschen (inkl. Sprachaufnahme) */
export async function deleteDiary(sessionId: string) {
  return run(async () => {
    const athlete = await requireAthlete();
    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) fail('Ungültiges Training.');
    const deleted = await rest<DiaryEntry[]>(`diary_entries?athlete=eq.${enc(athlete)}&session_id=eq.${enc(sessionId)}`, {
      method: 'DELETE',
      prefer: 'return=representation',
    });
    if (!deleted.length) fail('Eintrag nicht gefunden.');
    await removeObjects(DIARY_BUCKET, deleted.map((d) => d.audio_path).filter((p): p is string => Boolean(p)));
    revalidatePath('/');
    revalidatePath(`/trainer/training/${sessionId}`);
    revalidatePath('/trainer/tagebuch');
  }, 'Eintrag gelöscht.');
}
