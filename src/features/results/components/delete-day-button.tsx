'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2Icon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deleteResultsDay } from '../actions';

export function DeleteDayButton({ athlete, date, label }: { athlete: string; date: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="ghost" size="icon" aria-label={`Einträge vom ${label} löschen`} onClick={() => setOpen(true)} className="text-muted-foreground hover:text-destructive">
        <Trash2Icon />
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einträge löschen?</DialogTitle>
            <DialogDescription>Alle Werte von {athlete} am {label} werden gelöscht. Das kann nicht rückgängig gemacht werden.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Abbrechen</Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteResultsDay(athlete, date);
                  if (res.ok) { toast.success(res.message); setOpen(false); } else toast.error(res.error);
                })
              }
            >
              {pending && <Loader2Icon className="animate-spin" />} Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
