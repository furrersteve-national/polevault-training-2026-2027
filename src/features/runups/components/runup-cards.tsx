'use client';

import { useState } from 'react';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { fmtM, type RunupCardModel } from '../lib';
import { RunupForm } from './runup-form';

type Editing = RunupCardModel | 'other' | null;

/** Stabdaten als Karten: eine Karte pro Anlauf (3, 6, 8 und ganzer Anlauf). readOnly für den Trainer. */
export function RunupCards({ cards, readOnly = false }: { cards: RunupCardModel[]; readOnly?: boolean }) {
  const [editing, setEditing] = useState<Editing>(null);
  const shown = readOnly ? cards.filter((c) => c.entry) : cards;
  const title = editing === 'other' ? 'Weiteren Anlauf erfassen' : editing ? editing.title : '';

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map((c) => (
          <li key={c.key}>
            <RunupCard card={c} readOnly={readOnly} onEdit={() => setEditing(c)} />
          </li>
        ))}
        {!readOnly && (
          <li>
            <button type="button" onClick={() => setEditing('other')}
              className="flex h-full min-h-28 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <PlusIcon className="size-4" aria-hidden /> Weiteren Anlauf hinzufügen
            </button>
          </li>
        )}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Werte in Metern – Komma oder Punkt ist beides ok.</DialogDescription>
          </DialogHeader>
          {editing === 'other' && <RunupForm steps={null} onDone={() => setEditing(null)} />}
          {editing && editing !== 'other' && (
            <RunupForm key={editing.key} entry={editing.entry} steps={editing.steps} choices={editing.choices} onDone={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RunupCard({ card, readOnly, onEdit }: { card: RunupCardModel; readOnly: boolean; onEdit: () => void }) {
  const e = card.entry;
  return (
    <div className={cn('flex h-full flex-col gap-3 rounded-xl border bg-card p-4', !e && 'border-dashed bg-transparent')}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{card.title}</h3>
        {!readOnly && (
          <Button variant={e ? 'ghost' : 'outline'} size="sm" onClick={onEdit} aria-label={`${card.title} ${e ? 'bearbeiten' : 'erfassen'}`}>
            {e ? <PencilIcon /> : <PlusIcon />} {e ? 'Bearbeiten' : 'Erfassen'}
          </Button>
        )}
      </div>
      {e ? (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Anlauf</dt>
              <dd className="text-xl font-bold text-primary tabular-nums">{fmtM(e.runup_m)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Griffhöhe</dt>
              <dd className="text-xl font-bold text-primary tabular-nums">{fmtM(e.grip_m)}</dd>
            </div>
          </dl>
          {e.note && <p className="text-sm">{e.note}</p>}
          <p className="mt-auto text-xs text-muted-foreground">Aktualisiert am {formatDate(e.date)}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Noch nicht erfasst.</p>
      )}
    </div>
  );
}
