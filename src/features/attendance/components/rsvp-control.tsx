'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CheckCircle2Icon, Loader2Icon, LockIcon, XCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { setRsvp } from '../actions';
import type { RsvpStatus } from '../lib';

type Props = { sessionId: string; dateLabel: string; status: RsvpStatus; reason: string; locked: boolean };

/**
 * An-/Abmelden. Standard: angemeldet.
 * Abmelden mit Bestätigung + optionalem Grund (Fehlervermeidung), Wiederanmelden mit einem Klick (Kontrolle & Rückgängig).
 */
export function RsvpControl({ sessionId, dateLabel, status, reason, locked }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useState<{ status: RsvpStatus; reason: string } | null>(null);
  const current = optimistic ?? { status, reason };

  function submit(next: RsvpStatus, why = '') {
    setOptimistic({ status: next, reason: why });
    start(async () => {
      const res = await setRsvp(sessionId, next, why);
      if (res.ok) {
        toast.success(next === 'yes' ? `Angemeldet für ${dateLabel}` : `Abgemeldet für ${dateLabel}`);
        setOpen(false);
        setText('');
      } else {
        toast.error(res.error);
      }
      setOptimistic(null);
    });
  }

  const statusBadge =
    current.status === 'yes' ? (
      <Badge variant="success"><CheckCircle2Icon /> Angemeldet</Badge>
    ) : (
      <Badge variant="muted"><XCircleIcon /> Abgemeldet</Badge>
    );

  if (locked) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        {statusBadge}
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><LockIcon className="size-3.5" /> Training hat begonnen</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div aria-live="polite">{statusBadge}</div>
        {current.status === 'yes' ? (
          <Button variant="outline" onClick={() => setOpen(true)} disabled={pending}>
            Abmelden
          </Button>
        ) : (
          <Button onClick={() => submit('yes')} disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />} Wieder anmelden
          </Button>
        )}
      </div>
      {current.status === 'no' && current.reason && <p className="text-sm text-muted-foreground">Grund: {current.reason}</p>}

      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Für {dateLabel} abmelden?</DialogTitle>
            <DialogDescription>Du kannst dich bis Trainingsbeginn jederzeit wieder anmelden.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`reason-${sessionId}`}>Grund <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              id={`reason-${sessionId}`}
              value={text}
              maxLength={200}
              placeholder="z. B. krank, Schule, Ferien"
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Abbrechen</Button>
            <Button variant="destructive" onClick={() => submit('no', text)} disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />} Abmelden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
