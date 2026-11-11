'use client';

import { useState } from 'react';
import { ChevronRightIcon, HistoryIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { fmtM, type RunupCardModel, type RunupHistoryRow } from '../lib';
import { RunupForm } from './runup-form';

type Open = { card: RunupCardModel; mode: 'detail' | 'edit' } | { card: null; mode: 'other' } | null;

type Props = { cards: RunupCardModel[]; history: RunupHistoryRow[]; readOnly?: boolean };

/**
 * Stabdaten als Karten: eine Karte pro Anlauf (3, 6, 8 und ganzer Anlauf).
 * Antippen öffnet den Verlauf; dort lässt sich die Karte bearbeiten. readOnly für den Trainer.
 */
export function RunupCards({ cards, history, readOnly = false }: Props) {
  const [open, setOpen] = useState<Open>(null);
  const shown = readOnly ? cards.filter((c) => c.entry) : cards;
  const close = () => setOpen(null);

  function openCard(card: RunupCardModel) {
    if (!card.entry && readOnly) return;
    setOpen({ card, mode: card.entry ? 'detail' : 'edit' });
  }

  const card = open?.card ?? null;
  const steps = card?.entry?.steps ?? card?.steps ?? null;
  const rows = steps === null ? [] : history.filter((h) => h.steps === steps);

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map((c) => (
          <li key={c.key}>
            <RunupCard card={c} count={history.filter((h) => h.steps === c.entry?.steps).length} onOpen={() => openCard(c)} />
          </li>
        ))}
        {!readOnly && (
          <li>
            <button type="button" onClick={() => setOpen({ card: null, mode: 'other' })}
              className="flex h-full min-h-28 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <PlusIcon className="size-4" aria-hidden /> Weiteren Anlauf hinzufügen
            </button>
          </li>
        )}
      </ul>

      <Dialog open={open !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          {open?.mode === 'other' && (
            <>
              <DialogHeader>
                <DialogTitle>Weiteren Anlauf erfassen</DialogTitle>
                <DialogDescription>Werte in Metern – Komma oder Punkt ist beides ok.</DialogDescription>
              </DialogHeader>
              <RunupForm steps={null} onDone={close} />
            </>
          )}

          {open?.mode === 'edit' && card && (
            <>
              <DialogHeader>
                <DialogTitle>{card.title} {card.entry ? 'bearbeiten' : 'erfassen'}</DialogTitle>
                <DialogDescription>Werte in Metern – Komma oder Punkt ist beides ok. Der alte Stand bleibt im Verlauf.</DialogDescription>
              </DialogHeader>
              <RunupForm key={card.key} entry={card.entry} steps={card.steps} choices={card.choices} onDone={close} />
            </>
          )}

          {open?.mode === 'detail' && card?.entry && (
            <>
              <DialogHeader>
                <DialogTitle>{card.title}</DialogTitle>
                <DialogDescription>Verlauf – neuester Stand zuoberst.</DialogDescription>
              </DialogHeader>
              <HistoryList rows={rows} />
              {!readOnly && (
                <Button size="lg" onClick={() => setOpen({ card, mode: 'edit' })}>
                  <PencilIcon /> Werte ändern
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RunupCard({ card, count, onOpen }: { card: RunupCardModel; count: number; onOpen: () => void }) {
  const e = card.entry;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={e ? `${card.title}: Verlauf anzeigen` : `${card.title} erfassen`}
      className={cn(
        'flex h-full w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-navy-300 hover:bg-navy-50/50',
        'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        !e && 'border-dashed bg-transparent',
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{card.title}</h3>
        {e ? <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden /> : <PlusIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
      </div>
      {e ? (
        <>
          <dl className="grid w-full grid-cols-2 gap-3">
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
          <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            Aktualisiert am {formatDate(e.date)}
            {count > 1 && <><span aria-hidden>·</span><HistoryIcon className="size-3.5" aria-hidden /> {count} Stände</>}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Noch nicht erfasst – antippen zum Erfassen.</p>
      )}
    </button>
  );
}

function HistoryList({ rows }: { rows: RunupHistoryRow[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Noch kein Verlauf.</p>;
  return (
    <ol className="divide-y rounded-lg border">
      {rows.map((r, i) => {
        const prev = rows[i + 1];
        const changed = (k: 'runup_m' | 'grip_m') => prev && prev[k] !== r[k];
        return (
          <li key={r.id} className={cn('flex flex-col gap-0.5 px-3 py-2.5', i === 0 && 'bg-navy-50/60')}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{formatDate(r.date)}</span>
              {i === 0 && <span className="text-xs font-medium text-primary">aktuell</span>}
            </div>
            <p className="flex flex-wrap gap-x-4 tabular-nums">
              <span><span className="text-sm text-muted-foreground">Anlauf </span><span className={cn(changed('runup_m') && 'font-semibold')}>{fmtM(r.runup_m)}</span></span>
              <span><span className="text-sm text-muted-foreground">Griff </span><span className={cn(changed('grip_m') && 'font-semibold')}>{fmtM(r.grip_m)}</span></span>
            </p>
            {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
