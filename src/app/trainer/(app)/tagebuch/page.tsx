import Link from 'next/link';
import { PageTitle } from '@/components/layout/app-header';
import { listAthletes } from '@/features/athletes/queries';
import { sharedDiary } from '@/features/diary/queries';
import { DiaryList } from '@/features/diary/components/diary-list';
import { PersonPicker } from '@/features/results/components/person-picker';

export const metadata = { title: 'Tagebuch' };

export default async function TrainerDiaryPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const sp = await searchParams;
  const [athletes, entries] = await Promise.all([listAthletes({ all: true }), sharedDiary()]);
  const person = sp.person && athletes.some((a) => a.name === sp.person) ? sp.person : '';
  const shown = person ? entries.filter((e) => e.athlete === person) : entries;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Trainingstagebuch"
        description="Einträge, welche die Athlet:innen für dich freigegeben haben. Private Einträge siehst du nicht."
      />
      <div className="flex flex-wrap items-center gap-3">
        <PersonPicker names={athletes.map((a) => a.name)} value={person} />
        {person && <Link href="/trainer/tagebuch" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Alle anzeigen</Link>}
      </div>
      <DiaryList
        entries={shown}
        mode="trainer"
        emptyText={person ? `${person} hat noch keine Einträge freigegeben.` : 'Noch keine freigegebenen Einträge.'}
      />
    </div>
  );
}
