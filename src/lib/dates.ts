// Datums-Hilfen. Alle Trainings finden in der Schweiz statt -> Zeitzone Europe/Zurich.
export const TZ = 'Europe/Zurich';

const pad = (n: number) => String(n).padStart(2, '0');

/** Heutiges Datum in Zürich als YYYY-MM-DD */
export function todayZurich(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return parts; // en-CA liefert YYYY-MM-DD
}

/** Zürcher Ortszeit (Datum + Uhrzeit) -> absoluter Zeitpunkt */
export function zurichToDate(date: string, time = '00:00'): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh || 0, mm || 0);
  // Offset von Zürich zu diesem Zeitpunkt bestimmen (berücksichtigt Sommerzeit)
  const offsetAt = (t: number) => {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(t));
    const get = (k: string) => Number(f.find((p) => p.type === k)?.value);
    return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute')) - t;
  };
  let t = asUtc - offsetAt(asUtc);
  t = asUtc - offsetAt(t);
  return new Date(t);
}

const dateOnly = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

/** "Mittwoch, 11. November" */
export const formatDateLong = (iso: string, withYear = false) =>
  new Intl.DateTimeFormat('de-CH', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) }).format(dateOnly(iso));

/** "Mi, 11.11." */
export const formatDateShort = (iso: string) => {
  const d = dateOnly(iso);
  const wd = new Intl.DateTimeFormat('de-CH', { timeZone: 'UTC', weekday: 'short' }).format(d).replace('.', '');
  return `${wd}, ${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.`;
};

/** "11.11.2026" */
export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

export const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : '');

export function formatTimeRange(start?: string | null, end?: string | null, endLate?: string | null) {
  if (!start) return '';
  let s = formatTime(start);
  if (end) s += ` – ${formatTime(end)}`;
  if (endLate) s += ` / ${formatTime(endLate)}`;
  return s;
}

/** "Heute", "Morgen", "in 5 Tagen", "vor 3 Tagen" */
export function relativeDay(iso: string, today = todayZurich()) {
  const diff = Math.round((dateOnly(iso).getTime() - dateOnly(today).getTime()) / 86400000);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  if (diff === -1) return 'Gestern';
  return diff > 0 ? `in ${diff} Tagen` : `vor ${-diff} Tagen`;
}

export const daysBetween = (a: string, b: string) => Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / 86400000);

/** Datum + n Tage (YYYY-MM-DD) */
export function addDaysISO(iso: string, days: number) {
  const d = dateOnly(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
