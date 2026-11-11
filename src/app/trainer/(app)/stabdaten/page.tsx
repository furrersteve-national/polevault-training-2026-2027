import Link from 'next/link';
import { DownloadIcon } from 'lucide-react';
import { PageTitle } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/dates';
import { listAthletes } from '@/features/athletes/queries';
import { allRunups, runupHistoryFor } from '@/features/runups/queries';
import { cardsFor, fmtM, FULL_STEPS, SHORT_STEPS, type Runup } from '@/features/runups/lib';
import { RunupCards } from '@/features/runups/components/runup-cards';
import { PersonPicker } from '@/features/results/components/person-picker';

export const metadata = { title: 'Stabdaten' };

const KNOWN: number[] = [...SHORT_STEPS, ...FULL_STEPS];
const fullAndOther = (list: Runup[]) => list.filter((r) => !(SHORT_STEPS as readonly number[]).includes(r.steps));

function Cell({ r }: { r?: Runup }) {
  if (!r) return <span className="text-muted-foreground">–</span>;
  return (
    <span className="tabular-nums">
      <span className="font-semibold">{fmtM(r.runup_m)}</span>
      <span className="block text-xs text-muted-foreground">Griff {fmtM(r.grip_m)}</span>
    </span>
  );
}

export default async function TrainerRunupsPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const sp = await searchParams;
  const [athletes, runups] = await Promise.all([listAthletes({ all: true }), allRunups()]);
  const active = athletes.filter((a) => a.active).map((a) => a.name);
  const of = (name: string) => runups.filter((r) => r.athlete === name);
  const person = sp.person && athletes.some((a) => a.name === sp.person) ? sp.person : active[0] ?? '';
  const history = person ? await runupHistoryFor(person) : [];

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Stabdaten"
        description="Anlauf und Griffhöhe pro Anlauf – von den Athletinnen selbst gepflegt."
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
              <CardTitle>Anlauf der Gruppe</CardTitle>
              <p className="text-sm text-muted-foreground">Oben Anlauf, darunter Griffhöhe. Name antippen für Details.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card">Name</TableHead>
                    {SHORT_STEPS.map((s) => <TableHead key={s}>{s} Schritte</TableHead>)}
                    <TableHead>Ganzer Anlauf</TableHead>
                    <TableHead>Aktualisiert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((n) => {
                    const list = of(n);
                    const last = [...list].sort((a, b) => b.date.localeCompare(a.date))[0];
                    const rest = fullAndOther(list).sort((a, b) => Number(KNOWN.includes(b.steps)) - Number(KNOWN.includes(a.steps)) || a.steps - b.steps);
                    return (
                      <TableRow key={n}>
                        <TableCell className="sticky left-0 bg-card font-medium">
                          <Link href={`/trainer/stabdaten?person=${encodeURIComponent(n)}`} className="underline-offset-4 hover:underline">{n}</Link>
                        </TableCell>
                        {SHORT_STEPS.map((s) => <TableCell key={s}><Cell r={list.find((r) => r.steps === s)} /></TableCell>)}
                        <TableCell>
                          {rest.length ? rest.map((r) => (
                            <div key={r.id} className="flex items-baseline gap-2 [&+&]:mt-1">
                              <span className="text-xs text-muted-foreground">{r.steps} Schr.</span> <Cell r={r} />
                            </div>
                          )) : <Cell />}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">{last ? formatDate(last.date) : 'nie'}</TableCell>
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
          {person && (of(person).length
            ? <RunupCards cards={cardsFor(of(person))} history={history} readOnly />
            : <p className="text-sm text-muted-foreground">{person} hat noch keine Stabdaten erfasst.</p>)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
