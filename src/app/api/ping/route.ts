import { NextResponse } from 'next/server';
import { rest } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TABLES = ['athletes', 'entries', 'exercises', 'sessions', 'rsvps', 'attendance'];

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

  const env = Object.fromEntries(
    ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'TRAINER_PASSWORD', 'GROUP_CODE'].map((k) => [k, process.env[k] ? 'gesetzt' : 'FEHLT']),
  );
  const tables: Record<string, string> = {};
  for (const t of TABLES) {
    try {
      await rest(`${t}?select=*&limit=1`);
      tables[t] = 'ok';
    } catch (e) {
      tables[t] = e instanceof Error ? e.message : 'Fehler';
    }
  }
  const ok = Object.values(env).every((v) => v === 'gesetzt' || false) && Object.values(tables).every((v) => v === 'ok');
  return NextResponse.json({ ok, umgebung: process.env.VERCEL_ENV ?? 'lokal', einstellungen: env, tabellen: tables });
}
