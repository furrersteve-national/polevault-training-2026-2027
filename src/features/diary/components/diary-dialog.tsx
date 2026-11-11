'use client';

import { useState } from 'react';
import { PencilIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DiaryEntry } from '../types';
import { DiaryComposer } from './diary-composer';

/** Älteren Tagebucheintrag bearbeiten (kleiner Stift im Verlauf) */
export function DiaryDialog({ sessionId, title, entry }: { sessionId: string; title: string; entry: DiaryEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={`Eintrag vom ${title} bearbeiten`} className="-mr-2 -mt-1.5 text-muted-foreground">
        <PencilIcon />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eintrag bearbeiten</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          {open && <DiaryComposer sessionId={sessionId} entry={entry} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
