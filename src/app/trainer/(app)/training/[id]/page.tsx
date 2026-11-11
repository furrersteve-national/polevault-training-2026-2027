import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeftIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateLong, relativeDay, todayZurich } from '@/lib/dates';
import { listAthletes } from '@/features/athletes/queries';
import { getSession } from '@/features/sessions/queries';
import { SessionMeta } from '@/features/sessions/components/session-meta';
import { SessionAdminActions } from '@/features/sessions/components/session-admin-actions';
import { presenceFor, rsvpsFor } from '@/features/attendance/queries';
import { buildRoster, summarize } from '@/features/attendance/lib';
import { AttendanceList } from '@/features/attendance/components/attendance-list';
import { sharedDiaryForSession } from '@/features/diary/queries';
import { DiaryList } from '@/features/diary/components/diary-list';

export const metadata = { title: 'Training' };

export default async function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  const today = todayZurich();
  const [athletes, rsvps, presence, diary] = await Promise.all([listAthletes(), rsvpsFor([id]), presenceFor([id]), sharedDiaryForSession(id)]);
  const roster = buildRoster(id, athletes.map((a) => a.name), rsvps, presence);
  const sum = summarize(roster);
  const cancelled = session.status === 'cancelled';
  const dateLabel = formatDateLong(session.date);

  return (
    <div className="flex flex-col gap-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/trainer"><ChevronLeftIcon /> Alle Trainings</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{formatDateLong(session.date, true)}</CardTitle>
            <Badge variant="secondary">{relativeDay(session.date, today)}</Badge>
            {cancelled && <Badge variant="warning">Fällt aus</Badge>}
          </div>
          {session.phase && <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{session.phase}</p>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {cancelled ? <p className="text-sm text-muted-foreground">{session.note || 'Kein Training.'}</p> : <SessionMeta session={session} />}
          <SessionAdminActions session={session} dateLabel={dateLabel} />
        </CardContent>
      </Card>

      {!cancelled && (
        <Card>
          <CardHeader>
            <CardTitle>An-/Abmeldungen & Anwesenheit</CardTitle>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="success">{sum.registered} angemeldet</Badge>
              <Badge variant="muted">{sum.declined} abgemeldet</Badge>
              {sum.recorded && <Badge variant="default">{sum.present} da</Badge>}
              {sum.noShow > 0 && <Badge variant="warning">{sum.noShow} unentschuldigt</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <AttendanceList sessionId={id} roster={roster} canRecord={session.date <= today} />
          </CardContent>
        </Card>
      )}

      {!cancelled && session.date <= today && (
        <Card>
          <CardHeader>
            <CardTitle>Trainingstagebuch</CardTitle>
            <p className="text-sm text-muted-foreground">Nur Einträge, welche die Athlet:innen für dich freigegeben haben.</p>
          </CardHeader>
          <CardContent>
            <DiaryList entries={diary} mode="trainer" emptyText="Noch keine freigegebenen Einträge zu diesem Training." />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
