import { PageTitle } from '@/components/layout/app-header';
import { requireAthlete } from '@/lib/auth';
import { formatDateShort, todayZurich } from '@/lib/dates';
import { listSessions } from '@/features/sessions/queries';
import { diaryOf } from '@/features/diary/queries';
import { DiaryCapture, type CaptureSession } from '@/features/diary/components/diary-capture';
import { DiaryList } from '@/features/diary/components/diary-list';

export const metadata = { title: 'Tagebuch' };

export default async function DiaryPage() {
  const name = await requireAthlete();
  const today = todayZurich();
  const [sessions, diary] = await Promise.all([listSessions({ to: today }), diaryOf(name)]);

  // Nur das aktuelle (heute oder zuletzt) und das vorherige Training
  const recent = sessions.filter((s) => s.status === 'planned').reverse().slice(0, 2);
  const capture: CaptureSession[] = recent.map((s, i) => ({
    id: s.id,
    label: `${s.date === today ? 'Heute' : i === 0 ? 'Aktuell' : 'Letztes'} · ${formatDateShort(s.date)}`,
    detail: s.content,
    entry: diary.find((d) => d.session_id === s.id),
  }));

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Tagebuch" description="Kurz festhalten, was du aus dem Training mitnimmst. Privat, ausser du gibst es frei." />
      {capture.length > 0 ? (
        <DiaryCapture sessions={capture} />
      ) : (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Sobald ein Training stattgefunden hat, kannst du hier deinen Eintrag schreiben.
        </p>
      )}
      <section aria-label="Bisherige Einträge" className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Bisherige Einträge</h2>
        <DiaryList entries={diary} mode="athlete" emptyText="Noch keine Einträge." />
      </section>
    </div>
  );
}
