'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createSession, updateSession } from '../actions';
import type { Session, SessionInput } from '../types';

type Props = {
  trigger: React.ReactNode;
  session?: Session; // ohne = neues Training
  defaults?: Partial<SessionInput>; // Vorschlag für neues Training (z. B. letztes Training)
};

const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

export function SessionFormDialog({ trigger, session, defaults }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const init = (): SessionInput => ({
    date: session?.date ?? defaults?.date ?? '',
    start_time: hhmm(session?.start_time ?? defaults?.start_time),
    end_time: hhmm(session?.end_time ?? defaults?.end_time),
    end_time_late: hhmm(session?.end_time_late ?? defaults?.end_time_late),
    phase: session?.phase ?? defaults?.phase ?? '',
    coach: session?.coach ?? defaults?.coach ?? '',
    content: session?.content ?? defaults?.content ?? '',
    location: session?.location ?? defaults?.location ?? '',
    status: session?.status ?? 'planned',
    note: session?.note ?? '',
  });
  const [form, setForm] = useState<SessionInput>(init);
  const set = <K extends keyof SessionInput>(k: K, v: SessionInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const cancelled = form.status === 'cancelled';

  function onOpenChange(o: boolean) {
    if (pending) return;
    if (o) setForm(init());
    setOpen(o);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return toast.error('Bitte ein Datum wählen.');
    start(async () => {
      const res = session ? await updateSession(session.id, form) : await createSession(form);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      setOpen(false);
      if (!session && typeof res.data === 'string') router.push(`/trainer/training/${res.data}`);
    });
  }

  const field = (id: keyof SessionInput, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`s-${id}`}>{label}</Label>
      <Input id={`s-${id}`} value={(form[id] as string) ?? ''} onChange={(e) => set(id, e.target.value as never)} {...props} />
    </div>
  );

  return (
    <>
      <span onClick={() => onOpenChange(true)} className="contents">{trigger}</span>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{session ? 'Training bearbeiten' : 'Neues Training'}</DialogTitle>
              <DialogDescription>Felder mit * sind Pflicht.</DialogDescription>
            </DialogHeader>

            {field('date', 'Datum *', { type: 'date', required: true })}

            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <Label htmlFor="s-cancelled">Fällt aus</Label>
                <p className="text-xs text-muted-foreground">Wird im Plan angezeigt, ohne An-/Abmeldung.</p>
              </div>
              <Switch id="s-cancelled" checked={cancelled} onCheckedChange={(c) => set('status', c ? 'cancelled' : 'planned')} />
            </div>

            {cancelled ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-note">Grund / Hinweis</Label>
                <Textarea id="s-note" value={form.note} maxLength={200} placeholder="z. B. Chränzli Hauptprobe" onChange={(e) => set('note', e.target.value)} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {field('start_time', 'Beginn *', { type: 'time', required: true })}
                  {field('end_time', 'Ende', { type: 'time' })}
                  {field('end_time_late', 'Ende (spät)', { type: 'time' })}
                </div>
                {field('content', 'Inhalt', { placeholder: 'z. B. Anlauf, Einstich, Techniktraining', maxLength: 300 })}
                <div className="grid grid-cols-2 gap-3">
                  {field('location', 'Ort', { placeholder: 'z. B. Dürrbach', maxLength: 80 })}
                  {field('coach', 'Trainer', { maxLength: 60 })}
                </div>
                {field('phase', 'Phase', { placeholder: 'z. B. Technikaufbau', maxLength: 60 })}
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Abbrechen</Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2Icon className="animate-spin" />} Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
