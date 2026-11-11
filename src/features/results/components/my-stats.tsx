import { TrophyIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/dates';
import { cn, fmtDelta, fmtNum } from '@/lib/utils';
import type { Exercise } from '@/features/exercises/types';
import { seriesFor, stats, type Entry } from '../lib';
import { Sparkline } from './charts';

/** Bestleistungen und Verlauf der eigenen Werte */
export function MyStats({ exercises, entries }: { exercises: Exercise[]; entries: Entry[] }) {
  const items = exercises
    .map((ex) => ({ ex, series: seriesFor(entries, ex.key) }))
    .filter((x) => x.series.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrophyIcon className="size-5 text-warning" /> Meine Bestleistungen</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Einträge. Trag deine ersten Resultate ein – hier siehst du danach deinen Fortschritt.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map(({ ex, series }) => {
              const st = stats(series)!;
              return (
                <li key={ex.key} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{ex.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        zuletzt {fmtNum(st.last)} {ex.unit} am {formatDate(st.lastDate)}
                        {st.delta !== null && (
                          <>
                            {' · '}
                            <span className={cn('font-medium', st.delta > 0 && 'text-success', st.delta < 0 && 'text-destructive')}>{fmtDelta(st.delta)}</span> seit Start
                          </>
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-xl font-bold text-primary">
                      {fmtNum(st.best)} <span className="text-sm font-medium">{ex.unit}</span>
                    </p>
                  </div>
                  <Sparkline series={series} className="mt-2 h-9 w-full text-primary" />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
