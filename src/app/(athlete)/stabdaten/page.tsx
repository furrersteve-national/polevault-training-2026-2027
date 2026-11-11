import { PageTitle } from '@/components/layout/app-header';
import { requireAthlete } from '@/lib/auth';
import { runupHistoryFor, runupsFor } from '@/features/runups/queries';
import { cardsFor } from '@/features/runups/lib';
import { RunupCards } from '@/features/runups/components/runup-cards';

export const metadata = { title: 'Stabdaten' };

export default async function RunupsPage() {
  const name = await requireAthlete();
  const [entries, history] = await Promise.all([runupsFor(name), runupHistoryFor(name)]);
  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Stabdaten" description="Dein Anlauf und deine Griffhöhe pro Anlauf – immer griffbereit. Karte antippen für den Verlauf." />
      <RunupCards cards={cardsFor(entries)} history={history} />
    </div>
  );
}
