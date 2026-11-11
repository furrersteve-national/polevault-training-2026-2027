import { LockIcon, UsersIcon } from 'lucide-react';
import { formatDateShort } from '@/lib/dates';
import type { DiaryEntry } from '../types';
import { DiaryDialog } from './diary-dialog';

type Props = {
  entries: DiaryEntry[];
  /** athlete: eigene Einträge mit Bearbeiten. trainer: mit Name, nur lesen. */
  mode: 'athlete' | 'trainer';
  emptyText: string;
};

const yearOf = (iso: string) => iso.slice(0, 4);

/** Tagebuch als schlichtes Log: der Text steht im Vordergrund, Datum klein darüber. */
export function DiaryList({ entries, mode, emptyText }: Props) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  const thisYear = new Date().getFullYear().toString();
  return (
    <ol className="flex flex-col gap-2">
      {entries.map((e) => {
        const date = `${formatDateShort(e.date)}${yearOf(e.date) !== thisYear ? yearOf(e.date) : ''}`;
        return (
          <li key={e.id} className="rounded-lg border bg-card px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                {mode === 'trainer' && <span className="font-semibold text-foreground">{e.athlete}</span>}
                <span>{date}</span>
                {mode === 'athlete' && (
                  e.shared
                    ? <span className="inline-flex items-center gap-1"><UsersIcon className="size-3" aria-hidden /> freigegeben</span>
                    : <span className="inline-flex items-center gap-1"><LockIcon className="size-3" aria-hidden /> privat</span>
                )}
              </p>
              {mode === 'athlete' && e.session_id && <DiaryDialog sessionId={e.session_id} title={date} entry={e} />}
            </div>
            {e.text && <p className="mt-1 leading-relaxed whitespace-pre-wrap">{e.text}</p>}
            {e.audio_path && (
              e.audioUrl
                ? <audio controls src={e.audioUrl} preload="none" className="mt-2 h-10 w-full" aria-label={`Sprachnachricht vom ${date}`} />
                : <p className="mt-1 text-sm text-muted-foreground">Sprachnachricht konnte nicht geladen werden.</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
