import { TrendingDownIcon, TrendingUpIcon, MinusIcon, TrophyIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/dates';
import { cn, fmtDelta, fmtNum } from '@/lib/utils';
import type { Exercise } from '@/features/exercises/types';
import { seriesFor, stats, type Entry } from '../lib';
import { LineChart } from './charts';

const EMPTY = 'Noch keine Einträge. Trag deine ersten Resultate ein – hier siehst du danach deinen Fortschritt.';

function withData(exercises: Exercise[], entries: Entry[]) {
  return exercises
    .map((ex) => ({ ex, series: seriesFor(entries, ex.key) }))
    .filter((x) => x.series.length > 0)
    .map((x) => ({ ...x, st: stats(x.series)! }));
}

/** Bestleistung pro Übung */
export function BestResults({ exercises, entries }: { exercises: Exercise[]; entries: Entry[] }) {
  const items = withData(exercises, entries);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrophyIcon className="size-5 text-warning" aria-hidden /> Meine Bestresultate</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{EMPTY}</p>
        ) : (
          <ul className="divide-y">
            {items.map(({ ex, st }) => (
              <li key={ex.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{ex.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    am {formatDate(st.bestDate)} · {st.count} {st.count === 1 ? 'Eintrag' : 'Einträge'}
                  </p>
                </div>
                <p className="shrink-0 text-xl font-bold text-primary tabular-nums">
                  {fmtNum(st.best)} <span className="text-sm font-medium">{ex.unit}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Verlauf pro Übung mit Veränderung seit dem ersten Eintrag */
export function Trend({ exercises, entries }: { exercises: Exercise[]; entries: Entry[] }) {
  const items = withData(exercises, entries);
  if (!items.length) {
    return (
      <Card><CardContent><p className="text-sm text-muted-foreground">{EMPTY}</p></CardContent></Card>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {items.map(({ ex, series, st }) => (
        <Card key={ex.key}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{ex.label}</CardTitle>
              <TrendBadge delta={st.delta} unit={ex.unit} />
            </div>
            <p className="text-sm text-muted-foreground">
              {series.length === 1
                ? `Erst ein Eintrag (${fmtNum(st.last)} ${ex.unit}) – ab dem zweiten siehst du hier eine Kurve.`
                : `Von ${fmtNum(st.first)} auf ${fmtNum(st.last)} ${ex.unit} (${formatDate(st.firstDate)} – ${formatDate(st.lastDate)})`}
            </p>
          </CardHeader>
          {series.length > 1 && <CardContent><LineChart series={series} unit={ex.unit} /></CardContent>}
        </Card>
      ))}
    </div>
  );
}

function TrendBadge({ delta, unit }: { delta: number | null; unit: string }) {
  if (delta === null) return null;
  const Icon = delta > 0 ? TrendingUpIcon : delta < 0 ? TrendingDownIcon : MinusIcon;
  return (
    <span className={cn(
      'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums',
      delta > 0 ? 'bg-success-soft text-success' : delta < 0 ? 'bg-destructive-soft text-destructive' : 'bg-muted text-muted-foreground',
    )}>
      <Icon className="size-4" aria-hidden /> {fmtDelta(delta)} {unit}
    </span>
  );
}
