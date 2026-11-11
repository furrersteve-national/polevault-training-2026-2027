import { PageTitle } from '@/components/layout/app-header';
import { Card, CardContent } from '@/components/ui/card';
import { requireAthlete } from '@/lib/auth';
import { todayZurich } from '@/lib/dates';
import { loadExercises } from '@/features/exercises/queries';
import { entriesFor } from '@/features/results/queries';
import { ResultsForm } from '@/features/results/components/results-form';
import { MyStats } from '@/features/results/components/my-stats';

export const metadata = { title: 'Resultate' };

export default async function ResultsPage() {
  const name = await requireAthlete();
  const [exercises, entries] = await Promise.all([loadExercises(), entriesFor(name)]);
  const today = todayZurich();

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Resultate" description="Trag 1× pro Woche deine Resultate ein." />
      <Card>
        <CardContent>
          {/* key: Formular neu aufbauen, wenn sich die gespeicherten Werte ändern */}
          <ResultsForm key={entries.length} exercises={exercises} entries={entries} today={today} />
        </CardContent>
      </Card>
      <MyStats exercises={exercises} entries={entries} />
    </div>
  );
}
