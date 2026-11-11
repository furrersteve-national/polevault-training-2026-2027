import { NextResponse } from 'next/server';
import { isTrainer } from '@/lib/auth';
import { formatDate, todayZurich } from '@/lib/dates';
import { fmtNum } from '@/lib/utils';
import { listAthletes } from '@/features/athletes/queries';
import { loadExercises } from '@/features/exercises/queries';
import { allEntries } from '@/features/results/queries';
import { listSessions } from '@/features/sessions/queries';
import { presenceFor, rsvpsFor } from '@/features/attendance/queries';
import { buildRoster } from '@/features/attendance/lib';
import { allRunups } from '@/features/runups/queries';

export const dynamic = 'force-dynamic';

const csv = (rows: (string | number)[][]) =>
  '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');

export async function GET(req: Request) {
  if (!(await isTrainer())) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  const t = new URL(req.url).searchParams.get('type');
  const type = t === 'attendance' || t === 'runups' ? t : 'results';
  let rows: (string | number)[][];

  if (type === 'results') {
    const [exercises, entries] = await Promise.all([loadExercises({ all: true }), allEntries()]);
    const shown = exercises.filter((ex) => ex.active || entries.some((e) => e.exercise === ex.key));
    rows = [['Name', 'Datum', ...shown.map((ex) => `${ex.label} (${ex.unit})`)]];
    const keys = [...new Set(entries.map((e) => `${e.athlete}|${e.date}`))].sort();
    for (const k of keys) {
      const [n, d] = k.split('|');
      rows.push([n, formatDate(d), ...shown.map((ex) => fmtNum(entries.find((e) => e.athlete === n && e.date === d && e.exercise === ex.key)?.value))]);
    }
  } else if (type === 'runups') {
    const list = (await allRunups()).sort((a, b) => a.athlete.localeCompare(b.athlete) || a.date.localeCompare(b.date) || a.id - b.id);
    const m = (n: number | null) => (n === null ? '' : String(n).replace('.', ','));
    rows = [['Name', 'Datum', 'Anlauf (Schritte)', 'Anlauf (m)', 'Griffhöhe (m)', 'Bemerkung']];
    for (const r of list) rows.push([r.athlete, formatDate(r.date), r.steps, m(r.runup_m), m(r.grip_m), r.note]);
  } else {
    const [sessions, athletes] = await Promise.all([listSessions(), listAthletes()]);
    const planned = sessions.filter((s) => s.status === 'planned');
    const ids = planned.map((s) => s.id);
    const [rsvps, presence] = await Promise.all([rsvpsFor(ids), presenceFor(ids)]);
    rows = [['Datum', 'Name', 'Anmeldung', 'Grund', 'Anwesend']];
    for (const s of planned) {
      for (const r of buildRoster(s.id, athletes.map((a) => a.name), rsvps, presence)) {
        rows.push([formatDate(s.date), r.athlete, r.rsvp === 'yes' ? 'angemeldet' : 'abgemeldet', r.reason, r.present === null ? '' : r.present ? 'ja' : 'nein']);
      }
    }
  }

  return new NextResponse(csv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type === 'results' ? 'resultate' : type === 'runups' ? 'stabdaten' : 'anwesenheit'}-${todayZurich()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
