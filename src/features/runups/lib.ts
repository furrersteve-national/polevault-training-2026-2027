// Stabdaten: pro Athletin und Schrittzahl ein Eintrag (Anlauf in m, Griffhöhe in m).
// Kein Leistungsnachweis – einfach die aktuellen Daten griffbereit halten. Reine Funktionen (Server und Browser).

export type Runup = {
  id: number;
  athlete: string;
  date: string;
  steps: number;
  runup_m: number | null;
  grip_m: number | null;
  note: string;
  updated_at?: string;
};

export type RunupInput = { steps: string; runup_m: string; grip_m: string; note: string };

/** Die üblichen Anläufe: 3, 6, 8 Schritte und der ganze Anlauf mit 10, 12 oder 14 Schritten */
export const SHORT_STEPS = [3, 6, 8] as const;
export const FULL_STEPS = [10, 12, 14] as const;

export const LIMITS = {
  steps: { min: 1, max: 30 },
  runup_m: { min: 1, max: 60 },
  grip_m: { min: 1, max: 6 },
} as const;

/** Eine Karte auf der Stabdaten-Seite: gespeicherter Eintrag oder leerer Platzhalter */
export type RunupCardModel = {
  key: string;
  title: string;
  steps: number | null; // null = Schrittzahl wird beim Erfassen gewählt
  choices?: readonly number[];
  entry?: Runup;
};

export function cardsFor(list: Runup[]): RunupCardModel[] {
  const by = new Map(list.map((r) => [r.steps, r]));
  const cards: RunupCardModel[] = SHORT_STEPS.map((s) => ({ key: `s${s}`, title: `${s} Schritte`, steps: s, entry: by.get(s) }));
  const full = list.filter((r) => (FULL_STEPS as readonly number[]).includes(r.steps));
  if (full.length) {
    for (const r of full) cards.push({ key: `s${r.steps}`, title: `Ganzer Anlauf · ${r.steps} Schritte`, steps: r.steps, choices: FULL_STEPS, entry: r });
  } else {
    cards.push({ key: 'full', title: 'Ganzer Anlauf', steps: null, choices: FULL_STEPS });
  }
  const known = new Set<number>([...SHORT_STEPS, ...FULL_STEPS]);
  for (const r of list) if (!known.has(r.steps)) cards.push({ key: `s${r.steps}`, title: `${r.steps} Schritte`, steps: r.steps, entry: r });
  return cards.sort((a, b) => (a.steps ?? 10) - (b.steps ?? 10));
}

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
  if (steps === null) errors.steps = 'Bitte die Anzahl Schritte wählen.';
  else if (!Number.isInteger(steps) || steps < LIMITS.steps.min || steps > LIMITS.steps.max)
    errors.steps = `Ganze Zahl zwischen ${LIMITS.steps.min} und ${LIMITS.steps.max}.`;

  const runup = parseNum(input.runup_m);
  if (runup !== null && (Number.isNaN(runup) || runup < LIMITS.runup_m.min || runup > LIMITS.runup_m.max))
    errors.runup_m = Number.isNaN(runup) ? 'Nur Zahlen, z. B. 18,5.' : `Zwischen ${LIMITS.runup_m.min} und ${LIMITS.runup_m.max} m.`;

  const grip = parseNum(input.grip_m);
  if (grip !== null && (Number.isNaN(grip) || grip < LIMITS.grip_m.min || grip > LIMITS.grip_m.max))
    errors.grip_m = Number.isNaN(grip) ? 'Nur Zahlen, z. B. 3,40.' : `Zwischen ${LIMITS.grip_m.min} und ${LIMITS.grip_m.max} m.`;

  if (runup === null && grip === null && !input.note.trim()) errors.runup_m = 'Bitte Anlauf oder Griffhöhe eintragen.';
  if (input.note.length > 200) errors.note = 'Höchstens 200 Zeichen.';
  return errors;
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
