import 'server-only';
import { enc, restOr } from '@/lib/db';
import { signedDownloadUrls } from '@/lib/storage';
import { DIARY_BUCKET, type DiaryEntry } from './types';

const FIELDS = 'id,athlete,session_id,date,text,audio_path,audio_mime,audio_seconds,shared,updated_at,session:sessions(content,phase)';

/** Abspiel-Links für Einträge mit Sprachaufnahme ergänzen */
async function withAudio(entries: DiaryEntry[]): Promise<DiaryEntry[]> {
  const urls = await signedDownloadUrls(DIARY_BUCKET, entries.map((e) => e.audio_path).filter((p): p is string => Boolean(p)));
  return entries.map((e) => ({ ...e, audioUrl: e.audio_path ? urls.get(e.audio_path) : undefined }));
}

/** Alle Einträge einer Athletin, neueste zuerst */
export async function diaryOf(athlete: string): Promise<DiaryEntry[]> {
  return withAudio(await restOr<DiaryEntry[]>(`diary_entries?select=${FIELDS}&athlete=eq.${enc(athlete)}&order=date.desc,id.desc`, []));
}

/** Trainer: freigegebene Einträge eines Trainings */
export async function sharedDiaryForSession(sessionId: string): Promise<DiaryEntry[]> {
  return withAudio(
    await restOr<DiaryEntry[]>(`diary_entries?select=${FIELDS}&session_id=eq.${enc(sessionId)}&shared=eq.true&order=athlete.asc`, []),
  );
}

/** Trainer: alle freigegebenen Einträge (neueste zuerst) */
export async function sharedDiary(limit = 200): Promise<DiaryEntry[]> {
  return withAudio(await restOr<DiaryEntry[]>(`diary_entries?select=${FIELDS}&shared=eq.true&order=date.desc,athlete.asc&limit=${limit}`, []));
}
