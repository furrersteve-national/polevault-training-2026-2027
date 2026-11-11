import { PageTitle } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listAthletes } from '@/features/athletes/queries';
import { allGoals } from '@/features/goals/queries';
import { GoalsPanel } from '@/features/goals/components/goals-panel';
import { GoalForManyDialog } from '@/features/goals/components/goal-for-many-dialog';

export const metadata = { title: 'Ziele' };

export default async function TrainerGoalsPage() {
  const [athletes, goals] = await Promise.all([listAthletes(), allGoals()]);
  const names = athletes.map((a) => a.name);

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Ziele"
        description="Die nächsten Themen pro Athletin. Sie erscheinen hervorgehoben auf ihrer Startseite; die Athletinnen können sie anpassen und abhaken."
        actions={<GoalForManyDialog names={names} />}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {names.map((n) => {
          const list = goals.filter((g) => g.athlete === n);
          const open = list.filter((g) => !g.done).length;
          return (
            <Card key={n}>
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between gap-2">
                  {n}
                  <span className="text-sm font-normal text-muted-foreground">{open} offen</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GoalsPanel goals={list} forAthlete={n} emptyText="Noch keine Ziele." />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
