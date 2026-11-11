import { NextResponse } from 'next/server';
import { rest, supabaseKey } from '@/lib/db';
import { signedDownloadUrls, signedUploadUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const TABLES = ['athletes', 'entries', 'exercises', 'sessions', 'rsvps', 'attendance', 'runups', 'runup_history', 'diary_entries', 'goals'];

/**
 * Kleine Datenbankabfrage. Wird täglich von Vercel (Cron, siehe vercel.json) aufgerufen,
 * damit das Gratis-Projekt bei Supabase nicht wegen Inaktivität pausiert.
 * Mit ?check=1: Diagnose (Einstellungen vorhanden? Tabellen vorhanden?) – ohne geheime Werte.
 */
export async function GET(req: Request) {
  const check = new URL(req.url).searchParams.has('check');
  if (!check) {
    try {
      const rows = await rest<unknown[]>('athletes?select=name&limit=1');
      return NextResponse.json({ ok: true, time: new Date().toISOString(), rows: rows.length });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Fehler' }, { status: 502 });
    }
  }

  const env: Record<string, string> = Object.fromEntries(
    ['SUPABASE_URL', 'TRAINER_PASSWORD', 'GROUP_CODE'].map((k) => [k, process.env[k]?.trim() ? 'gesetzt' : 'FEHLT']),
  );
  env.SUPABASE_SECRET_KEY = supabaseKey() ? 'gesetzt' : 'FEHLT';
  // Nur die NAMEN vorhandener Variablen (nie Werte), um Tippfehler zu finden
  const vorhandeneNamen = Object.keys(process.env).filter((k) => /SUPA|TRAINER|GROUP|SECRET/i.test(k)).sort();
  const tables: Record<string, string> = {};
  for (const t of TABLES) {
    try {
      await rest(`${t}?select=*&limit=1`);
      tables[t] = 'ok';
    } catch (e) {
      tables[t] = e instanceof Error ? e.message : 'Fehler';
    }
  }
  // Speicher für Sprachaufnahmen: signierte Upload-Adresse holen (es wird nichts hochgeladen)
  let speicher = 'ok';
  try {
    await signedUploadUrl('diary', `_check/${crypto.randomUUID()}.webm`);
    await signedDownloadUrls('diary', ['_check/nicht-vorhanden.webm']);
  } catch (e) {
    speicher = e instanceof Error ? `${e.message} ${(e as Error & { detail?: string }).detail ?? ''}`.trim() : 'Fehler';
  }
  const ok = Object.values(env).every((v) => v === 'gesetzt') && Object.values(tables).every((v) => v === 'ok') && speicher === 'ok';
  return NextResponse.json({ ok, umgebung: process.env.VERCEL_ENV ?? 'lokal', einstellungen: env, vorhandeneNamen, tabellen: tables, speicher });
}
