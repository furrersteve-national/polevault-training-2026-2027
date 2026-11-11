import { CalendarOffIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDateLong, relativeDay } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { RsvpControl } from '@/features/attendance/components/rsvp-control';
import type { RsvpStatus } from '@/features/attendance/lib';
import { rsvpLocked, type Session } from '../types';
import { SessionMeta } from './session-meta';

type Props = { session: Session; rsvp: { status: RsvpStatus; reason: string }; today: string; highlight?: boolean };

/** Ein Training aus Sicht der Athletin / des Athleten */
export function SessionCard({ session, rsvp, today, highlight }: Props) {
  const cancelled = session.status === 'cancelled';
  const rel = relativeDay(session.date, today);
  const showRel = ['Heute', 'Morgen'].includes(rel);

  return (
    <Card className={cn(cancelled && 'bg-muted/40 shadow-none', highlight && !cancelled && 'border-l-4 border-l-highlight')}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn('text-base font-semibold', cancelled && 'text-muted-foreground')}>{formatDateLong(session.date)}</h3>
          {showRel && <Badge variant={rel === 'Heute' ? 'highlight' : 'navy'}>{rel}</Badge>}
          {cancelled && <Badge variant="warning"><CalendarOffIcon /> Fällt aus</Badge>}
        </div>
        {session.phase && !cancelled && <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{session.phase}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {cancelled ? (
          <p className="text-sm text-muted-foreground">{session.note || 'Kein Training.'}</p>
        ) : (
          <>
            <SessionMeta session={session} />
            <div className="border-t pt-3">
              <RsvpControl
                sessionId={session.id}
                dateLabel={formatDateLong(session.date)}
                status={rsvp.status}
                reason={rsvp.reason}
                locked={rsvpLocked(session)}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
