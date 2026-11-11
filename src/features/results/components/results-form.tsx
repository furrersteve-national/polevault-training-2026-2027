'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { saveResults } from '../actions';
import { VALUE_RE, type Entry } from '../lib';
import type { Exercise } from '@/features/exercises/types';
import { fmtNum } from '@/lib/utils';

type Props = { exercises: Exercise[]; entries: Entry[]; today: string };

/** Formular für die Resultate eines Tages. Bestehende Werte des gewählten Tages werden vorausgefüllt (korrigierbar). */
export function ResultsForm({ exercises, entries, today }: Props) {
  const [date, setDate] = useState(today);
  const valuesFor = (d: string) =>
    Object.fromEntries(exercises.map((ex) => [ex.key, fmtNum(entries.find((e) => e.date === d && e.exercise === ex.key)?.value)]));
  const [values, setValues] = useState<Record<string, string>>(() => valuesFor(today));
  const [touched, setTouched] = useState(false);
  const [pending, start] = useTransition();

  const existingCount = useMemo(() => entries.filter((e) => e.date === date).length, [entries, date]);
  const invalid = Object.entries(values).filter(([, v]) => v.trim() !== '' && !VALUE_RE.test(v.trim())).map(([k]) => k);
  const filled = Object.values(values).filter((v) => v.trim() !== '').length;

  function changeDate(d: string) {
    setDate(d);
    setValues(valuesFor(d));
    setTouched(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (invalid.length) return toast.error('Bitte nur Zahlen eintragen, z. B. 12 oder 7,5.');
    if (!filled) return toast.error('Bitte mindestens ein Resultat eintragen.');
    start(async () => {
      const res = await saveResults(date, values);
      if (res.ok) toast.success(`Gespeichert ✓ (${res.data} ${res.data === 1 ? 'Wert' : 'Werte'})`);
      else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Datum</Label>
        <Input id="date" type="date" value={date} max={today} onChange={(e) => changeDate(e.target.value)} required />
        {existingCount > 0 && (
          <Alert variant="info">
            <AlertDescription className="col-start-1 col-span-2">
              Für diesen Tag hast du schon {existingCount} {existingCount === 1 ? 'Wert' : 'Werte'} eingetragen. Du kannst sie hier korrigieren.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <p className="text-sm text-muted-foreground">Übungen, die du nicht gemacht hast, einfach leer lassen.</p>

      {exercises.map((ex) => {
        const bad = touched && invalid.includes(ex.key);
        const id = `v-${ex.key}`;
        return (
          <div key={ex.key} className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-base">{ex.label}</Label>
            {ex.hint && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{ex.hint}</p>}
            <div className="flex items-center gap-3">
              <Input
                id={id}
                inputMode="decimal"
                autoComplete="off"
                placeholder="–"
                value={values[ex.key] ?? ''}
                aria-invalid={bad || undefined}
                aria-describedby={ex.hint ? `${id}-hint` : undefined}
                onChange={(e) => setValues((v) => ({ ...v, [ex.key]: e.target.value }))}
                className="max-w-40"
              />
              <span className="min-w-10 text-sm text-muted-foreground">{ex.unit}</span>
            </div>
            {bad && <p className="text-sm text-destructive">Nur Zahlen, z. B. 12 oder 7,5.</p>}
          </div>
        );
      })}

      <Button type="submit" size="lg" disabled={pending} className="sticky bottom-20 z-10 shadow-md sm:static sm:shadow-xs">
        {pending && <Loader2Icon className="animate-spin" />}
        {pending ? 'Wird gespeichert …' : 'Resultate speichern'}
      </Button>
    </form>
  );
}
