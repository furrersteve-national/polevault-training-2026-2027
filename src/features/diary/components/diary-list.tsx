import { EyeIcon, LockIcon, MicIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateLong } from '@/lib/dates';
import { fmtDuration, type DiaryEntry } from '../types';
import { DiaryDialog } from './diary-dialog';

type Props = {
  entries: DiaryEntry[];
  /** athlete: eigene Einträge mit Bearbeiten. trainer: Name statt Freigabe-Status, nur lesen. */
  mode: 'athlete' | 'trainer';
  emptyText: string;
};

/** Verlauf der Tagebucheinträge */
export function DiaryList({ entries, mode, emptyText }: Props) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {entries.map((e) => (
        <li key={e.id} className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{mode === 'trainer' ? e.athlete : formatDateLong(e.date, true)}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {mode === 'trainer' ? formatDateLong(e.date, true) : e.session?.content || 'Training'}
              </p>
            </div>
            {mode === 'athlete' ? (
              <div className="flex shrink-0 items-center gap-1">
                {e.shared
                  ? <Badge variant="navy"><EyeIcon /> Trainer</Badge>
                  : <Badge variant="muted"><LockIcon /> Privat</Badge>}
                {e.session_id && (
                  <DiaryDialog sessionId={e.session_id} title={formatDateLong(e.date)} subtitle={e.session?.content || undefined} entry={e} variant="link" />
                )}
              </div>
            ) : e.audio_path ? (
              <Badge variant="muted"><MicIcon /> {fmtDuration(e.audio_seconds)}</Badge>
            ) : null}
          </div>
          {e.text && <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{e.text}</p>}
          {e.audio_path && (
            <div className="mt-3">
              {e.audioUrl
                ? <audio controls src={e.audioUrl} preload="none" className="w-full" aria-label={`Sprachnachricht vom ${formatDateLong(e.date)}`} />
                : <p className="text-sm text-muted-foreground">Sprachnachricht konnte nicht geladen werden.</p>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
