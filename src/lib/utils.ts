import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Zahl hübsch formatieren (max. 2 Nachkommastellen) */
export function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return String(Math.round(n * 100) / 100);
}

export function fmtDelta(n: number | null | undefined) {
  if (n === null || n === undefined) return '';
  const s = fmtNum(Math.abs(n));
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : '±0';
}

/** Ergebnis einer Server-Action: entweder ok oder eine verständliche Fehlermeldung */
export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };
