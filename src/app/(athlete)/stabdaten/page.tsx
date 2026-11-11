import { PageTitle } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireAthlete } from '@/lib/auth';
import { todayZurich } from '@/lib/dates';
import { runupsFor } from '@/features/runups/queries';
import { latestBySteps, seriesOf, sortNewest } from '@/features/runups/lib';
import { CurrentSetup } from '@/features/runups/components/current-setup';
import { RunupForm } from '@/features/runups/components/runup-form';
import { RunupHistory } from '@/features/runups/components/runup-history';
import { LineChart } from '@/features/results/components/charts';

export const metadata = { title: 'Stabdaten' };

export default async function RunupsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [name, sp] = await Promise.all([requireAthlete(), searchParams]);
  const entries = await runupsFor(name);
  const today = todayZurich();
  const newest = sortNewest(entries)[0];
  const recentSteps = latestBySteps(entries).map((r) => r.steps).sort((a, b) => a - b);
  const grip = seriesOf(entries, 'grip_m');
  const runup = newest ? seriesOf(entries, 'runup_m', newest.steps) : [];

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Stabdaten" description="Dein Anlauf und deine Griffhöhe – immer griffbereit." />
      <CurrentSetup entries={entries} />

      <Tabs defaultValue={sp.tab === 'verlauf' ? 'verlauf' : 'erfassen'}>
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="erfassen">Erfassen</TabsTrigger>
          <TabsTrigger value="verlauf">Verlauf</TabsTrigger>
        </TabsList>

        <TabsContent value="erfassen">
          <Card>
            <CardHeader>
              <CardTitle>Anlauf erfassen</CardTitle>
              <p className="text-sm text-muted-foreground">
                {newest ? 'Dein letzter Anlauf ist schon eingetragen – ändere nur, was neu ist.' : 'Trag deinen Anlauf nach dem Training ein.'}
              </p>
            </CardHeader>
            <CardContent>
              <RunupForm key={entries.length} today={today} suggestion={newest} recentSteps={recentSteps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verlauf" className="flex flex-col gap-4">
          {grip.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Griffhöhe</CardTitle></CardHeader>
              <CardContent><LineChart series={grip} unit="m" /></CardContent>
            </Card>
          )}
          {runup.length > 1 && (
            <Card>
              <CardHeader><CardTitle>Anlauf bei {newest!.steps} Schritten</CardTitle></CardHeader>
              <CardContent><LineChart series={runup} unit="m" /></CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Alle Einträge</CardTitle></CardHeader>
            <CardContent>
              <RunupHistory entries={entries} today={today} canEdit emptyText="Noch keine Anläufe erfasst. Wechsle zu «Erfassen», um deinen ersten Anlauf einzutragen." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
