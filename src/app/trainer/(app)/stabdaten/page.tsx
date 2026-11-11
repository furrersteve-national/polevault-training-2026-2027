import Link from 'next/link';
import { DownloadIcon } from 'lucide-react';
import { PageTitle } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { daysBetween, formatDate, todayZurich } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { listAthletes } from '@/features/athletes/queries';
import { allRunups } from '@/features/runups/queries';
import { bestGrip, fmtM, seriesOf, sortNewest, type Runup } from '@/features/runups/lib';
import { CurrentSetup } from '@/features/runups/components/current-setup';
import { RunupHistory } from '@/features/runups/components/runup-history';
import { LineChart } from '@/features/results/components/charts';
import { PersonPicker } from '@/features/results/components/person-picker';

export const metadata = { title: 'Stabdaten' };

export default async function TrainerRunupsPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const sp = await searchParams;
  const [athletes, runups] = await Promise.all([listAthletes({ all: true }), allRunups()]);
  const today = todayZurich();
  const active = athletes.filter((a) => a.active).map((a) => a.name);
  const of = (name: string) => runups.filter((r) => r.athlete === name);
  const person = sp.person && athletes.some((a) => a.name === sp.person) ? sp.person : active[0] ?? '';

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Stabdaten"
        description="Anlauf und Griffhöhe – von den Athletinnen selbst erfasst."
        actions={<Button asChild variant="outline" size="sm"><a href="/trainer/export?type=runups" download><DownloadIcon /> CSV</a></Button>}
      />
      <Tabs key={sp.person ?? ''} defaultValue={sp.person ? 'person' : 'overview'}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="person">Pro Person</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Aktueller Anlauf der Gruppe</CardTitle>
              <p className="text-sm text-muted-foreground">Jeweils der neueste Eintrag. Rot = seit über 4 Wochen nichts erfasst.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card">Name</TableHead>
                    <TableHead className="text-right">Schritte</TableHead>
                    <TableHead className="text-right">Anlauf</TableHead>
                    <TableHead className="text-right">Griffhöhe</TableHead>
                    <TableHead className="text-right">Höchster Griff</TableHead>
                    <TableHead className="text-right">Erfasst</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((n) => {
                    const list = of(n);
                    const last = sortNewest(list)[0] as Runup | undefined;
                    const best = bestGrip(list);
                    const stale = !last || daysBetween(last.date, today) > 28;
                    return (
                      <TableRow key={n}>
                        <TableCell className="sticky left-0 bg-card font-medium">
                          <Link href={`/trainer/stabdaten?person=${encodeURIComponent(n)}`} className="underline-offset-4 hover:underline">{n}</Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{last ? last.steps : '–'}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtM(last?.runup_m)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{fmtM(last?.grip_m)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtM(best?.grip_m)}</TableCell>
                        <TableCell className={cn('text-right tabular-nums', stale && 'text-destructive')}>{last ? formatDate(last.date) : 'nie'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="person" className="flex flex-col gap-4">
          <PersonPicker names={athletes.map((a) => a.name)} value={person} />
          {person && <PersonRunups name={person} list={of(person)} today={today} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PersonRunups({ name, list, today }: { name: string; list: Runup[]; today: string }) {
  if (!list.length) return <p className="text-sm text-muted-foreground">{name} hat noch keine Stabdaten erfasst.</p>;
  const newest = sortNewest(list)[0];
  const grip = seriesOf(list, 'grip_m');
  const runup = seriesOf(list, 'runup_m', newest.steps);
  return (
    <>
      <CurrentSetup entries={list} />
      {grip.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Griffhöhe</CardTitle></CardHeader>
          <CardContent><LineChart series={grip} unit="m" /></CardContent>
        </Card>
      )}
      {runup.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Anlauf bei {newest.steps} Schritten</CardTitle></CardHeader>
          <CardContent><LineChart series={runup} unit="m" /></CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Alle Einträge von {name}</CardTitle></CardHeader>
        <CardContent><RunupHistory entries={list} today={today} /></CardContent>
      </Card>
    </>
  );
}
