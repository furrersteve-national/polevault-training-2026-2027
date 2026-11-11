import Link from 'next/link';
import { CalendarOffIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { PageTitle } from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addDaysISO, formatDateLong, formatDateShort, relativeDay, todayZurich } from '@/lib/dates';
import { listAthletes } from '@/features/athletes/queries';
import { listSessions } from '@/features/sessions/queries';
import { sessionTime, type Session } from '@/features/sessions/types';
import { SessionFormDialog } from '@/features/sessions/components/session-form-dialog';
import { presenceFor, rsvpsFor } from '@/features/attendance/queries';
import { buildRoster, summarize, type RosterSummary } from '@/features/attendance/lib';

export const metadata = { title: 'Trainings' };

export default async function TrainerSessionsPage() {
  const today = todayZurich();
  const [sessions, athletes] = await Promise.all([listSessions(), listAthletes()]);
  const ids = sessions.map((s) => s.id);
  const [rsvps, presence] = await Promise.all([rsvpsFor(ids), presenceFor(ids)]);
  const names = athletes.map((a) => a.name);
  const summaryOf = (s: Session) => summarize(buildRoster(s.id, names, rsvps, presence));

  const upcoming = sessions.filter((s) => s.date >= today);
  const past = sessions.filter((s) => s.date < today).reverse();
  const next = upcoming.find((s) => s.status === 'planned');
  const last = [...sessions].reverse().find((s) => s.status === 'planned');

  // Anwesenheitsstatistik über alle vergangenen Trainings mit erfasster Anwesenheit
  const held = sessions.filter((s) => s.status === 'planned' && s.date <= today);
  const statRows = names.map((name) => {
    let recorded = 0, present = 0, declined = 0, noShow = 0;
    for (const s of held) {
      const row = buildRoster(s.id, names, rsvps, presence).find((r) => r.athlete === name);
      if (!row) continue;
      if (row.rsvp === 'no') declined++;
      if (row.present !== null) {
        recorded++;
        if (row.present) present++;
        else if (row.rsvp === 'yes') noShow++;
      }
    }
    return { name, recorded, present, declined, noShow, rate: recorded ? Math.round((present / recorded) * 100) : null };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Trainings"
        description="Plan, An-/Abmeldungen und Anwesenheit"
        actions={
          <SessionFormDialog
            trigger={<Button><PlusIcon /> Neues Training</Button>}
            defaults={last ? { ...last, date: addDaysISO(last.date < today ? today : last.date, 7) } : undefined}
          />
        }
      />

      {next && <NextSessionCard session={next} summary={summaryOf(next)} today={today} declinedNames={buildRoster(next.id, names, rsvps, presence).filter((r) => r.rsvp === 'no')} />}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Kommende Trainings</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Trainings geplant. Lege mit «Neues Training» eines an.</p>
        ) : (
          <SessionList sessions={upcoming} summaryOf={summaryOf} today={today} />
        )}
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vergangene Trainings</h2>
          <SessionList sessions={past} summaryOf={summaryOf} today={today} isPast />
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Anwesenheit pro Person</CardTitle>
          <p className="text-sm text-muted-foreground">Gezählt werden vergangene Trainings, bei denen du die Anwesenheit erfasst hast.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Da</TableHead>
                <TableHead className="text-right">Abgemeldet</TableHead>
                <TableHead className="text-right" title="Angemeldet, aber nicht gekommen">Unentschuldigt</TableHead>
                <TableHead className="text-right">Quote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statRows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{r.present}/{r.recorded}</TableCell>
                  <TableCell className="text-right">{r.declined}</TableCell>
                  <TableCell className={`text-right ${r.noShow ? 'font-semibold text-destructive' : ''}`}>{r.noShow}</TableCell>
                  <TableCell className="text-right">{r.rate === null ? '–' : `${r.rate} %`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NextSessionCard({ session, summary, today, declinedNames }: { session: Session; summary: RosterSummary; today: string; declinedNames: { athlete: string; reason: string }[] }) {
  return (
    <Card className="border-l-4 border-l-highlight">
      <CardHeader>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nächstes Training · {relativeDay(session.date, today)}</p>
        <CardTitle className="text-lg">{formatDateLong(session.date)}{sessionTime(session) && `, ${sessionTime(session)}`}</CardTitle>
        {session.content && <p className="text-sm text-muted-foreground">{session.content}{session.location && ` · ${session.location}`}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-success-soft p-3">
            <p className="text-2xl font-bold text-success">{summary.registered}<span className="text-base font-medium">/{summary.total}</span></p>
            <p className="text-sm text-success">angemeldet</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-2xl font-bold">{summary.declined}</p>
            <p className="text-sm text-muted-foreground">abgemeldet</p>
          </div>
        </div>
        {declinedNames.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {declinedNames.map((d) => (
              <li key={d.athlete}><span className="font-medium">{d.athlete}</span>{d.reason && <span className="text-muted-foreground"> – {d.reason}</span>}</li>
            ))}
          </ul>
        )}
        <Button asChild variant="outline" className="self-start">
          <Link href={`/trainer/training/${session.id}`}>Details & Anwesenheit <ChevronRightIcon /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function SessionList({ sessions, summaryOf, today, isPast }: { sessions: Session[]; summaryOf: (s: Session) => RosterSummary; today: string; isPast?: boolean }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {sessions.map((s) => {
        const sum = summaryOf(s);
        const cancelled = s.status === 'cancelled';
        const needsRecording = !cancelled && s.date <= today && !sum.recorded;
        return (
          <li key={s.id}>
            <Link href={`/trainer/training/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 focus-visible:bg-muted/50 outline-none">
              <div className="w-20 shrink-0 text-sm font-semibold">{formatDateShort(s.date)}</div>
              <div className="min-w-0 flex-1">
                {cancelled ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarOffIcon className="size-4" /> Fällt aus{s.note && ` – ${s.note}`}</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    {isPast && sum.recorded ? (
                      <>
                        <Badge variant="success">{sum.present} da</Badge>
                        {sum.noShow > 0 && <Badge variant="warning">{sum.noShow} unentschuldigt</Badge>}
                      </>
                    ) : (
                      <>
                        <Badge variant="success">{sum.registered} angemeldet</Badge>
                        {sum.declined > 0 && <Badge variant="muted">{sum.declined} abgemeldet</Badge>}
                      </>
                    )}
                    {needsRecording && <Badge variant="warning">Anwesenheit offen</Badge>}
                  </div>
                )}
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
