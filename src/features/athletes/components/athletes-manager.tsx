'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { addAthlete, setAthleteActive } from '../actions';
import type { Athlete } from '../queries';

export function AthletesManager({ athletes }: { athletes: Athlete[] }) {
  const [name, setName] = useState('');
  const [pending, start] = useTransition();

  const act = (p: Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) =>
    start(async () => {
      const res = await p;
      if (res.ok) { toast.success(res.message); after?.(); } else toast.error(res.error);
    });

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y rounded-lg border">
        {athletes.map((a) => (
          <li key={a.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className={a.active ? 'font-medium' : 'text-muted-foreground'}>{a.name}</span>
            <div className="flex items-center gap-2">
              <Label htmlFor={`a-${a.name}`} className="font-normal text-muted-foreground">{a.active ? 'aktiv' : 'inaktiv'}</Label>
              <Switch id={`a-${a.name}`} checked={a.active} disabled={pending} onCheckedChange={(c) => act(setAthleteActive(a.name, c))} />
            </div>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) act(addAthlete(name), () => setName(''));
        }}
      >
        <Label htmlFor="new-athlete">Neue Person</Label>
        <div className="flex gap-2">
          <Input id="new-athlete" value={name} maxLength={40} placeholder="Vorname" onChange={(e) => setName(e.target.value)} />
          <Button type="submit" disabled={pending || !name.trim()} className="shrink-0">
            {pending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />} Hinzufügen
          </Button>
        </div>
      </form>
    </div>
  );
}
