import { NextResponse } from 'next/server';
import { rest } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Kleine Datenbankabfrage. Wird täglich von Vercel (Cron, siehe vercel.json) aufgerufen,
 * damit das Gratis-Projekt bei Supabase nicht wegen Inaktivität pausiert.
 */
export async function GET() {
  try {
    const rows = await rest<unknown[]>('athletes?select=name&limit=1');
    return NextResponse.json({ ok: true, time: new Date().toISOString(), rows: rows.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Fehler' }, { status: 502 });
  }
}
