import { PageTitle } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { daysBetween, formatDate, formatDateShort, todayZurich } from '@/lib/dates';
import { cn, fmtDelta, fmtNum } from '@/lib/utils';
import { listAthletes } from '@/features/athletes/queries';
import { loadExercises } from '@/features/exercises/queries';
import { allEntries } from '@/features/results/queries';
import { seriesFor, stats, type Entry } from '@/features/results/lib';
import type { Exercise } from '@/features/exercises/types';
import { LineChart } from '@/features/results/components/charts';
import { DeleteDayButton } from '@/features/results/components/delete-day-button';
import { PersonPicker } from '@/features/results/components/person-picker';

export const metadata = { title: 'Resultate' };

export default async function TrainerResultsPage({ searchParams }: { searchParams: Promise<{ person?: string; tab?: string }> }) {
  const sp = await searchParams;
  const [athletes, exercises, entries] = await Promise.all([listAthletes({ all: true }), loadExercises({ all: true }), allEntries()]);
  const today = todayZurich();
  const active = athletes.filter((a) => a.active).map((a) => a.name);
  const activeEx = exercises.filter((e) => e.active);
  const of = (name: string) => entries.filter((e) => e.athlete === name);
  const person = sp.person && athletes.some((a) => a.name === sp.person) ? sp.person : active[0] ?? '';

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Resultate" description="Bestleistungen und Verlauf der Gruppe" />
      <Tabs defaultValue={sp.person ? 'person' : 'overview'}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="person">Pro Person</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Bestleistungen</CardTitle>
              <p className="text-sm text-muted-foreground">Kleine Zahl = Veränderung vom ersten zum letzten Eintrag.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card">Übung</TableHead>
                    {active.map((n) => <TableHead key={n} className="text-right">{n}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEx.map((ex) => (
                    <TableRow key={ex.key}>
                      <TableCell className="sticky left-0 max-w-40 bg-card whitespace-normal">
                        {ex.label} <span className="text-muted-foreground">({ex.unit})</span>
                      </TableCell>
                      {active.map((n) => {
                        const st = stats(seriesFor(of(n), ex.key));
                        if (!st) return <TableCell key={n} className="text-right text-muted-foreground">–</TableCell>;
                        return (
                          <TableCell key={n} className="text-right">
                            <span className="font-semibold">{fmtNum(st.best)}</span>
                            {st.delta !== null && (
                              <span className={cn('block text-xs', st.delta > 0 ? 'text-success' : st.delta < 0 ? 'text-destructive' : 'text-muted-foreground')}>{fmtDelta(st.delta)}</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-card">Letzter Eintrag</TableCell>
                    {active.map((n) => {
                      const dates = of(n).map((e) => e.date).sort();
                      const last = dates[dates.length - 1];
                      const stale = !last || daysBetween(last, today) > 14;
                      return <TableCell key={n} className={cn('text-right', stale && 'text-destructive')}>{last ? formatDateShort(last) : 'nie'}</TableCell>;
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="person" className="flex flex-col gap-4">
          <PersonPicker names={athletes.map((a) => a.name)} value={person} />
          {person && <PersonResults name={person} entries={of(person)} exercises={exercises} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PersonResults({ name, entries: list, exercises }: { name: string; entries: Entry[]; exercises: Exercise[] }) {
  const shown = exercises.filter((ex) => ex.active || list.some((e) => e.exercise === ex.key));
  const dates = [...new Set(list.map((e) => e.date))].sort().reverse();
  if (!dates.length) return <p className="text-sm text-muted-foreground">{name} hat noch keine Resultate eingetragen.</p>;
  return (
    <>
      <Card>
        <CardHeader><CardTitle>Alle Einträge von {name}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card">Datum</TableHead>
                {shown.map((ex) => <TableHead key={ex.key} className="text-right" title={ex.label}>{ex.label.replace('Sprossenwand: ', 'Spr. ')}</TableHead>)}
                <TableHead><span className="sr-only">Aktionen</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dates.map((d) => (
                <TableRow key={d}>
                  <TableCell className="sticky left-0 bg-card font-medium">{formatDate(d)}</TableCell>
                  {shown.map((ex) => {
                    const e = list.find((x) => x.date === d && x.exercise === ex.key);
                    return <TableCell key={ex.key} className="text-right">{e ? fmtNum(e.value) : ''}</TableCell>;
                  })}
                  <TableCell><DeleteDayButton athlete={name} date={d} label={formatDate(d)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {shown.map((ex) => {
        const s = seriesFor(list, ex.key);
        if (!s.length) return null;
        return (
          <Card key={ex.key}>
            <CardHeader>
              <CardTitle>{ex.label} <span className="font-normal text-muted-foreground">– Bestleistung {fmtNum(stats(s)!.best)} {ex.unit}</span></CardTitle>
            </CardHeader>
            <CardContent><LineChart series={s} unit={ex.unit} /></CardContent>
          </Card>
        );
      })}
    </>
  );
}
