'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarCheckIcon, CalendarOffIcon, Loader2Icon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deleteSession, setSessionCancelled } from '../actions';
import type { Session } from '../types';
import { SessionFormDialog } from './session-form-dialog';

/** Bearbeiten, absagen/wieder ansetzen, löschen – mit Bestätigung bei folgenschweren Aktionen */
export function SessionAdminActions({ session, dateLabel }: { session: Session; dateLabel: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dialog, setDialog] = useState<'cancel' | 'delete' | null>(null);
  const [note, setNote] = useState('');
  const cancelled = session.status === 'cancelled';

  function act(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) {
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      setDialog(null);
      after?.();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <SessionFormDialog session={session} trigger={<Button variant="outline"><PencilIcon /> Bearbeiten</Button>} />
      {cancelled ? (
        <Button variant="outline" disabled={pending} onClick={() => act(() => setSessionCancelled(session.id, false))}>
          {pending ? <Loader2Icon className="animate-spin" /> : <CalendarCheckIcon />} Findet doch statt
        </Button>
      ) : (
        <Button variant="outline" onClick={() => { setNote(''); setDialog('cancel'); }}>
          <CalendarOffIcon /> Absagen
        </Button>
      )}
      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDialog('delete')}>
        <Trash2Icon /> Löschen
      </Button>

      <Dialog open={dialog === 'cancel'} onOpenChange={(o) => !pending && setDialog(o ? 'cancel' : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training vom {dateLabel} absagen?</DialogTitle>
            <DialogDescription>Das Training bleibt im Plan sichtbar und wird als «Fällt aus» markiert.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancel-note">Hinweis für die Gruppe <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea id="cancel-note" value={note} maxLength={200} placeholder="z. B. Halle besetzt" onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>Abbrechen</Button>
            <Button variant="destructive" disabled={pending} onClick={() => act(() => setSessionCancelled(session.id, true, note))}>
              {pending && <Loader2Icon className="animate-spin" />} Training absagen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'delete'} onOpenChange={(o) => !pending && setDialog(o ? 'delete' : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training vom {dateLabel} löschen?</DialogTitle>
            <DialogDescription>
              Das Training verschwindet ganz aus dem Plan – inklusive An-/Abmeldungen und Anwesenheit. Das kann nicht rückgängig gemacht werden.
              Wenn es nur ausfällt, wähle besser «Absagen».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>Abbrechen</Button>
            <Button variant="destructive" disabled={pending} onClick={() => act(() => deleteSession(session.id), () => router.push('/trainer'))}>
              {pending && <Loader2Icon className="animate-spin" />} Endgültig löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
