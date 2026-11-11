'use client';

import { useState, useTransition } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trainerLogin } from '../actions';

export function LoginForm() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    start(async () => {
      const res = await trainerLogin(pw);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pw">Passwort</Label>
        <Input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={!!error || undefined} autoFocus />
      </div>
      {error && <Alert variant="destructive"><AlertDescription className="col-span-2 col-start-1">{error}</AlertDescription></Alert>}
      <Button type="submit" size="lg" disabled={pending || !pw}>{pending && <Loader2Icon className="animate-spin" />} Anmelden</Button>
    </form>
  );
}
