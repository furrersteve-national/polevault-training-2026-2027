'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2Icon, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addGoalForMany } from '../actions';
import { MAX_GOAL } from '../types';

/** Trainer: ein Ziel mehreren Athletinnen gleichzeitig geben */
export function GoalForManyDialog({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const all = picked.length === names.length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await addGoalForMany(text, picked);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(`Ziel an ${res.data} ${res.data === 1 ? 'Athletin' : 'Athletinnen'} vergeben ✓`);
      setOpen(false);
      setText('');
      setPicked([]);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><UsersIcon /> Ziel für mehrere</Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Ziel für mehrere Athletinnen</DialogTitle>
              <DialogDescription>Jede bekommt das Ziel einzeln und kann es danach selbst anpassen oder abhaken.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="many-goal">Ziel</Label>
              <Input id="many-goal" value={text} maxLength={MAX_GOAL} onChange={(e) => setText(e.target.value)} placeholder="z. B. Letzte zwei Schritte schneller" />
            </div>
            <div role="group" aria-labelledby="many-legend" className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p id="many-legend" className="text-sm font-medium">Athletinnen</p>
                <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setPicked(all ? [] : names)}>
                  {all ? 'Keine' : 'Alle'} auswählen
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {names.map((n) => (
                  <label key={n} className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm has-[[data-state=checked]]:border-primary">
                    <Checkbox
                      checked={picked.includes(n)}
                      onCheckedChange={(c) => setPicked((p) => (c ? [...p, n] : p.filter((x) => x !== n)))}
                    />
                    {n}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Abbrechen</Button>
              <Button type="submit" disabled={pending || !text.trim() || !picked.length}>
                {pending && <Loader2Icon className="animate-spin" />} Vergeben
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
