// Trainingstagebuch: ein Eintrag pro Athletin und Training (Text und/oder Sprachaufnahme).
// Privat – der Trainer sieht ihn nur, wenn die Athletin ihn freigibt.

export type DiaryEntry = {
  id: number;
  athlete: string;
  session_id: string | null;
  date: string;
  text: string;
  audio_path: string | null;
  audio_mime: string | null;
  audio_seconds: number | null;
  shared: boolean;
  updated_at: string;
  session?: { content: string; phase: string } | null;
  /** Kurzlebiger Abspiel-Link (vom Server erzeugt) */
  audioUrl?: string;
};

export const DIARY_BUCKET = 'diary';
export const MAX_TEXT = 5000;
export const MAX_AUDIO_SECONDS = 300; // 5 Minuten

/** Erlaubte Aufnahmeformate (Chrome/Android: webm, iPhone: mp4) */
export const AUDIO_TYPES: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/aac': 'aac',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
};

/** "audio/webm;codecs=opus" -> "audio/webm" */
export const baseMime = (mime: string) => mime.split(';')[0].trim().toLowerCase();

export function fmtDuration(seconds: number | null | undefined) {
  if (!seconds && seconds !== 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
