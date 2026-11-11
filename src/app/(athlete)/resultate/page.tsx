import { PageTitle } from '@/components/layout/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireAthlete } from '@/lib/auth';
import { todayZurich } from '@/lib/dates';
import { loadExercises } from '@/features/exercises/queries';
import { entriesFor } from '@/features/results/queries';
import { ResultsForm } from '@/features/results/components/results-form';
import { BestResults, Trend } from '@/features/results/components/my-stats';

export const metadata = { title: 'Resultate' };

const TABS = ['eintragen', 'bestresultate', 'trend'] as const;

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [name, sp] = await Promise.all([requireAthlete(), searchParams]);
  const [exercises, entries] = await Promise.all([loadExercises(), entriesFor(name)]);
  const today = todayZurich();
  const tab = TABS.find((t) => t === sp.tab) ?? 'eintragen';

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Resultate" description="Trag 1× pro Woche deine Resultate ein." />
      <Tabs defaultValue={tab}>
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="eintragen">Eintragen</TabsTrigger>
          <TabsTrigger value="bestresultate">Bestresultate</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
        </TabsList>
        <TabsContent value="eintragen">
          <Card>
            <CardContent>
              {/* key: Formular neu aufbauen, wenn sich die gespeicherten Werte ändern */}
              <ResultsForm key={entries.length} exercises={exercises} entries={entries} today={today} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bestresultate">
          <BestResults exercises={exercises} entries={entries} />
        </TabsContent>
        <TabsContent value="trend">
          <Trend exercises={exercises} entries={entries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
