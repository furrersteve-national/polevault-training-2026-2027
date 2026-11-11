'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DiaryEntry } from '../types';
import { DiaryComposer } from './diary-composer';

export type CaptureSession = { id: string; label: string; detail: string; entry?: DiaryEntry };

/** Eintrag fürs aktuelle oder letzte Training – Auswahl per Schalter, Eingabe direkt darunter. */
export function DiaryCapture({ sessions }: { sessions: CaptureSession[] }) {
  const [selected, setSelected] = useState(sessions[0]?.id);
  const current = sessions.find((s) => s.id === selected) ?? sessions[0];
  if (!current) return null;

  return (
    <section aria-label="Neuer Eintrag" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      {sessions.length > 1 ? (
        <div role="group" aria-label="Training wählen" className="flex flex-wrap gap-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === current.id}
              onClick={() => setSelected(s.id)}
              className={cn(
                'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors hover:bg-accent',
                s.id === current.id && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
              )}
            >
              {s.label}{s.entry && <span aria-label="hat Eintrag"> ✓</span>}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium">{current.label}</p>
      )}
      {current.detail && <p className="-mt-1 text-xs text-muted-foreground">{current.detail}</p>}
      <DiaryComposer key={`${current.id}-${current.entry?.updated_at ?? 'neu'}`} sessionId={current.id} entry={current.entry} />
    </section>
  );
}
