import { CalendarXIcon, InfoIcon } from 'lucide-react';
import { PageTitle } from '@/components/layout/app-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireAthlete } from '@/lib/auth';
import { daysBetween, formatDateLong, formatDateShort, todayZurich } from '@/lib/dates';
import { listSessions } from '@/features/sessions/queries';
import { SessionCard } from '@/features/sessions/components/session-card';
import { rsvpsOfAthlete } from '@/features/attendance/queries';
import { diaryOf } from '@/features/diary/queries';
import { DiaryDialog } from '@/features/diary/components/diary-dialog';
import { DiaryList } from '@/features/diary/components/diary-list';
import type { Session } from '@/features/sessions/types';

export const metadata = { title: 'Trainings' };

export default async function TrainingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [name, sp] = await Promise.all([requireAthlete(), searchParams]);
  const today = todayZurich();
  const [sessions, rsvps, diary] = await Promise.all([listSessions(), rsvpsOfAthlete(name), diaryOf(name)]);

  const upcoming = sessions.filter((s) => s.date >= today);
  const past = sessions.filter((s) => s.date < today && daysBetween(s.date, today) <= 28).reverse();
  const next = upcoming.find((s) => s.status === 'planned');
  const rsvpOf = (id: string) => {
    const r = rsvps.find((x) => x.session_id === id);
    return { status: r?.status ?? 'yes', reason: r?.reason ?? '' } as const;
  };
  const diaryButton = (s: Session, variant: 'button' | 'link') => (
    <DiaryDialog
      key={`${s.id}-${diary.find((d) => d.session_id === s.id)?.updated_at ?? 'new'}`}
      sessionId={s.id}
      title={formatDateLong(s.date)}
      subtitle={s.content || undefined}
      entry={diary.find((d) => d.session_id === s.id)}
      variant={variant}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title={`Hallo ${name}!`} description="Du bist automatisch für alle Trainings angemeldet. Melde dich ab, wenn du nicht kommen kannst." />

      <Tabs defaultValue={sp.tab === 'tagebuch' ? 'tagebuch' : 'trainings'}>
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="trainings">Trainings</TabsTrigger>
          <TabsTrigger value="tagebuch">Tagebuch{diary.length > 0 && <span className="text-muted-foreground tabular-nums">({diary.length})</span>}</TabsTrigger>
        </TabsList>

        <TabsContent value="trainings" className="flex flex-col gap-5">
          {upcoming.length === 0 ? (
            <Alert>
              <CalendarXIcon />
              <AlertTitle>Keine Trainings geplant</AlertTitle>
              <AlertDescription>Sobald der Trainer neue Trainings einträgt, erscheinen sie hier.</AlertDescription>
            </Alert>
          ) : (
            <section aria-label="Kommende Trainings" className="flex flex-col gap-3">
              {upcoming.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  rsvp={rsvpOf(s.id)}
                  today={today}
                  highlight={s.id === next?.id}
                  footer={s.date === today && s.status === 'planned' ? diaryButton(s, 'button') : undefined}
                />
              ))}
            </section>
          )}

          {past.length > 0 && (
            <details className="group rounded-xl border bg-card" open={past.some((s) => s.status === 'planned' && daysBetween(s.date, today) <= 7) || undefined}>
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-muted-foreground marker:hidden">
                Vergangene Trainings ({past.length}) <span className="ml-1 inline-block transition-transform group-open:rotate-180">▾</span>
              </summary>
              <ul className="divide-y border-t">
                {past.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                    <span className="min-w-0">
                      {formatDateShort(s.date)} · {s.status === 'cancelled' ? 'fiel aus' : s.content || 'Training'}
                      {s.status === 'planned' && (
                        <span className="block text-xs text-muted-foreground">{rsvpOf(s.id).status === 'yes' ? 'angemeldet' : 'abgemeldet'}</span>
                      )}
                    </span>
                    {s.status === 'planned' && diaryButton(s, 'link')}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0" /> An- und Abmelden geht bis Trainingsbeginn. Das Tagebuch kannst du ab dem Trainingstag schreiben.
          </p>
        </TabsContent>

        <TabsContent value="tagebuch">
          <DiaryList
            entries={diary}
            mode="athlete"
            emptyText="Noch keine Einträge. Beim heutigen oder bei vergangenen Trainings findest du «Tagebuch schreiben»."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
