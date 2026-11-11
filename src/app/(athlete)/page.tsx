import { CalendarXIcon, InfoIcon } from 'lucide-react';
import { PageTitle } from '@/components/layout/app-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { requireAthlete } from '@/lib/auth';
import { daysBetween, formatDateShort, todayZurich } from '@/lib/dates';
import { listSessions } from '@/features/sessions/queries';
import { SessionCard } from '@/features/sessions/components/session-card';
import { rsvpsOfAthlete } from '@/features/attendance/queries';

export const metadata = { title: 'Trainings' };

export default async function TrainingsPage() {
  const name = await requireAthlete();
  const today = todayZurich();
  const [sessions, rsvps] = await Promise.all([listSessions(), rsvpsOfAthlete(name)]);

  const upcoming = sessions.filter((s) => s.date >= today);
  const past = sessions.filter((s) => s.date < today && daysBetween(s.date, today) <= 28).reverse();
  const next = upcoming.find((s) => s.status === 'planned');
  const rsvpOf = (id: string) => {
    const r = rsvps.find((x) => x.session_id === id);
    return { status: r?.status ?? 'yes', reason: r?.reason ?? '' } as const;
  };

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title={`Hallo ${name}!`} description="Du bist automatisch für alle Trainings angemeldet. Melde dich ab, wenn du nicht kommen kannst." />

      {upcoming.length === 0 ? (
        <Alert>
          <CalendarXIcon />
          <AlertTitle>Keine Trainings geplant</AlertTitle>
          <AlertDescription>Sobald der Trainer neue Trainings einträgt, erscheinen sie hier.</AlertDescription>
        </Alert>
      ) : (
        <section aria-label="Kommende Trainings" className="flex flex-col gap-3">
          {upcoming.map((s) => (
            <SessionCard key={s.id} session={s} rsvp={rsvpOf(s.id)} today={today} highlight={s.id === next?.id} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <details className="group rounded-xl border bg-card">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-muted-foreground marker:hidden">
            Vergangene Trainings ({past.length}) <span className="ml-1 inline-block transition-transform group-open:rotate-180">▾</span>
          </summary>
          <ul className="divide-y border-t">
            {past.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>{formatDateShort(s.date)} · {s.status === 'cancelled' ? 'fiel aus' : s.content || 'Training'}</span>
                {s.status === 'planned' && <span className="text-muted-foreground">{rsvpOf(s.id).status === 'yes' ? 'angemeldet' : 'abgemeldet'}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" /> An- und Abmelden geht bis Trainingsbeginn. Danach bitte direkt beim Trainer melden.
      </p>
    </div>
  );
}
