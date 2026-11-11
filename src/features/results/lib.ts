// Reine Rechenfunktionen für Resultate (Server und Browser)

export type Entry = { id?: number; athlete?: string; date: string; exercise: string; value: number };
export type Point = { date: string; value: number };

export function seriesFor(entries: Entry[], exerciseKey: string): Point[] {
  return entries
    .filter((e) => e.exercise === exerciseKey)
    .map((e) => ({ date: e.date, value: Number(e.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type Stats = { best: number; first: number; last: number; delta: number | null; count: number; lastDate: string };

export function stats(series: Point[]): Stats | null {
  if (!series.length) return null;
  const values = series.map((p) => p.value);
  return {
    best: Math.max(...values),
    first: values[0],
    last: values[values.length - 1],
    delta: series.length > 1 ? values[values.length - 1] - values[0] : null,
    count: series.length,
    lastDate: series[series.length - 1].date,
  };
}

export const VALUE_RE = /^\d+([.,]\d+)?$/;
