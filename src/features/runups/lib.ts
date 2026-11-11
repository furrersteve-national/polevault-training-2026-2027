// Stabdaten: Anlauf (Schritte, Meter) und Griffhöhe. Reine Funktionen (Server und Browser).

export type Runup = {
  id: number;
  athlete: string;
  date: string;
  steps: number;
  runup_m: number | null;
  grip_m: number | null;
  note: string;
  created_at?: string;
};

export type RunupInput = { date: string; steps: string; runup_m: string; grip_m: string; note: string };

export const LIMITS = {
  steps: { min: 1, max: 30 },
  runup_m: { min: 1, max: 60 },
  grip_m: { min: 1, max: 6 },
} as const;

/** Komma oder Punkt als Dezimalzeichen. Leer = null, ungültig = NaN. */
export function parseNum(raw: string): number | null {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (s === '') return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return Number.NaN;
  return Number(s);
}

/** Prüft eine Eingabe. Gibt pro Feld eine verständliche Fehlermeldung zurück. */
export function validateRunup(input: RunupInput): Partial<Record<keyof RunupInput, string>> {
  const errors: Partial<Record<keyof RunupInput, string>> = {};
  const steps = parseNum(input.steps);
  if (steps === null) errors.steps = 'Bitte die Anzahl Schritte eintragen.';
  else if (!Number.isInteger(steps) || steps < LIMITS.steps.min || steps > LIMITS.steps.max)
    errors.steps = `Ganze Zahl zwischen ${LIMITS.steps.min} und ${LIMITS.steps.max}.`;

  const runup = parseNum(input.runup_m);
  if (runup !== null && (Number.isNaN(runup) || runup < LIMITS.runup_m.min || runup > LIMITS.runup_m.max))
    errors.runup_m = Number.isNaN(runup) ? 'Nur Zahlen, z. B. 18,5.' : `Zwischen ${LIMITS.runup_m.min} und ${LIMITS.runup_m.max} m.`;

  const grip = parseNum(input.grip_m);
  if (grip !== null && (Number.isNaN(grip) || grip < LIMITS.grip_m.min || grip > LIMITS.grip_m.max))
    errors.grip_m = Number.isNaN(grip) ? 'Nur Zahlen, z. B. 3,40.' : `Zwischen ${LIMITS.grip_m.min} und ${LIMITS.grip_m.max} m.`;

  if (input.note.length > 200) errors.note = 'Höchstens 200 Zeichen.';
  return errors;
}

/** Neueste zuerst (Datum, dann Erfassungszeit) */
export function sortNewest(list: Runup[]): Runup[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

/** Aktuellster Eintrag pro Schrittzahl – das «aktuelle Setup» einer Athletin */
export function latestBySteps(list: Runup[]): Runup[] {
  const seen = new Map<number, Runup>();
  for (const r of sortNewest(list)) if (!seen.has(r.steps)) seen.set(r.steps, r);
  return [...seen.values()].sort((a, b) => b.steps - a.steps);
}

/** Höchste erfasste Griffhöhe */
export function bestGrip(list: Runup[]): Runup | null {
  let best: Runup | null = null;
  for (const r of list) if (r.grip_m !== null && (!best || r.grip_m > (best.grip_m ?? 0))) best = r;
  return best;
}

/** Zeitreihe eines Werts (für Diagramme); pro Tag der neueste Eintrag */
export function seriesOf(list: Runup[], field: 'runup_m' | 'grip_m', steps?: number) {
  const byDate = new Map<string, number>();
  for (const r of [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)) {
    if (steps !== undefined && r.steps !== steps) continue;
    const v = r[field];
    if (v !== null) byDate.set(r.date, v);
  }
  return [...byDate.entries()].map(([date, value]) => ({ date, value }));
}

/** Meterangaben einheitlich mit 2 Nachkommastellen und Komma anzeigen */
export function fmtM(n: number | null | undefined) {
  if (n === null || n === undefined) return '–';
  return `${n.toFixed(2).replace('.', ',')} m`;
}

/** Für Eingabefelder: 18.5 -> "18,5" */
export function toInput(n: number | null | undefined) {
  return n === null || n === undefined ? '' : String(n).replace('.', ',');
}
