'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2Icon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/dates';
import { deleteRunup } from '../actions';
import { fmtM, type Runup } from '../lib';
import { RunupForm } from './runup-form';

type Props = {
  entries: Runup[];
  today: string;
  /** Athletin: eigene Einträge korrigieren. Trainer: nur löschen. */
  canEdit?: boolean;
  emptyText?: string;
};

/** Liste aller Anläufe, neueste zuerst – mit Korrigieren und Löschen */
export function RunupHistory({ entries, today, canEdit = false, emptyText = 'Noch keine Anläufe erfasst.' }: Props) {
  const [editing, setEditing] = useState<Runup | null>(null);
  const [deleting, setDeleting] = useState<Runup | null>(null);
  const [pending, start] = useTransition();

  if (!entries.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>;

  return (
    <>
      <ul className="divide-y">
        {entries.map((r) => (
          <li key={r.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{formatDate(r.date)}</p>
              <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 font-medium">
                <span>{r.steps} Schritte</span>
                <span><span className="font-normal text-muted-foreground">Anlauf </span>{fmtM(r.runup_m)}</span>
                <span><span className="font-normal text-muted-foreground">Griff </span>{fmtM(r.grip_m)}</span>
              </p>
              {r.note && <p className="mt-0.5 text-sm text-muted-foreground">{r.note}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              {canEdit && (
                <Button variant="ghost" size="icon" aria-label={`Anlauf vom ${formatDate(r.date)} korrigieren`} onClick={() => setEditing(r)}>
                  <PencilIcon />
                </Button>
              )}
              <Button variant="ghost" size="icon" aria-label={`Anlauf vom ${formatDate(r.date)} löschen`} onClick={() => setDeleting(r)}
                className="text-muted-foreground hover:text-destructive">
                <Trash2Icon />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anlauf korrigieren</DialogTitle>
            <DialogDescription>Ändere die Werte und speichere.</DialogDescription>
          </DialogHeader>
          {editing && <RunupForm key={editing.id} today={today} entry={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && !pending && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eintrag löschen?</DialogTitle>
            <DialogDescription>
              {deleting && `${formatDate(deleting.date)}: ${deleting.steps} Schritte, Anlauf ${fmtM(deleting.runup_m)}, Griff ${fmtM(deleting.grip_m)}. `}
              Das kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={pending}>Abbrechen</Button>
            <Button variant="destructive" disabled={pending}
              onClick={() => start(async () => {
                const res = await deleteRunup(deleting!.id);
                if (res.ok) { toast.success(res.message); setDeleting(null); } else toast.error(res.error);
              })}>
              {pending && <Loader2Icon className="animate-spin" />} Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
