import { ClockIcon, MapPinIcon, UserIcon } from 'lucide-react';
import { sessionTime, type Session } from '../types';

/** Uhrzeit, Ort, Trainer und Inhalt eines Trainings */
export function SessionMeta({ session }: { session: Session }) {
  const time = sessionTime(session);
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {session.content && <p className="font-medium text-foreground">{session.content}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        {time && (
          <span className="inline-flex items-center gap-1.5"><ClockIcon className="size-4" aria-hidden /> <span className="sr-only">Zeit:</span>{time}</span>
        )}
        {session.location && (
          <span className="inline-flex items-center gap-1.5"><MapPinIcon className="size-4" aria-hidden /> <span className="sr-only">Ort:</span>{session.location}</span>
        )}
        {session.coach && (
          <span className="inline-flex items-center gap-1.5"><UserIcon className="size-4" aria-hidden /> <span className="sr-only">Trainer:in: </span>{session.coach}</span>
        )}
      </div>
    </div>
  );
}
