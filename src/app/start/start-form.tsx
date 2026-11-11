'use client';

import { useState, useTransition } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { signIn, verifyCode } from './actions';

/** Zweistufige Anmeldung: Gruppen-Code -> Name. Das Gerät merkt sich beides. */
export function StartForm({ codeRequired, initialAthletes }: { codeRequired: boolean; initialAthletes: string[] | null }) {
  const [code, setCode] = useState('');
  const [athletes, setAthletes] = useState<string[] | null>(initialAthletes);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!code.trim()) return setError('Bitte den Gruppen-Code eingeben.');
    start(async () => {
      const res = await verifyCode(code);
      if (res.ok) setAthletes(res.data ?? []);
      else setError(res.error);
    });
  }

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name) return setError('Bitte deinen Namen wählen.');
    start(async () => {
      const res = await signIn(code, name);
      if (res && !res.ok) setError(res.error);
    });
  }

  if (!athletes) {
    return (
      <form onSubmit={submitCode} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Gruppen-Code</Label>
          <Input id="code" autoComplete="off" autoCapitalize="none" value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={!!error || undefined} autoFocus />
          <p className="text-sm text-muted-foreground">Den Code bekommst du von den Trainer:innen.</p>
        </div>
        {error && <Alert variant="destructive"><AlertDescription className="col-span-2 col-start-1">{error}</AlertDescription></Alert>}
        <Button type="submit" size="lg" disabled={pending}>{pending && <Loader2Icon className="animate-spin" />} Weiter</Button>
      </form>
    );
  }

  return (
    <form onSubmit={submitName} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Wer bist du?</Label>
        <Select value={name} onValueChange={setName}>
          <SelectTrigger id="name" aria-invalid={!!error || undefined}><SelectValue placeholder="Name wählen" /></SelectTrigger>
          <SelectContent>
            {athletes.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Dein Name fehlt? Sag den Trainer:innen Bescheid.</p>
      </div>
      {error && <Alert variant="destructive"><AlertDescription className="col-span-2 col-start-1">{error}</AlertDescription></Alert>}
      <Button type="submit" size="lg" disabled={pending}>{pending && <Loader2Icon className="animate-spin" />} Los geht&apos;s</Button>
      {codeRequired && (
        <Button type="button" variant="ghost" onClick={() => { setAthletes(null); setName(''); }}>Zurück</Button>
      )}
    </form>
  );
}
