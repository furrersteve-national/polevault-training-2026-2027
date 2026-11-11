'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { saveRunup } from '../actions';
import { toInput, validateRunup, type Runup, type RunupInput } from '../lib';

type Props = {
  today: string;
  /** Eintrag zum Korrigieren – ohne: neuer Eintrag */
  entry?: Runup;
  /** Vorschlag für einen neuen Eintrag (letzter Anlauf) */
  suggestion?: Runup;
  /** Schrittzahlen, die die Athletin schon verwendet hat (Schnellauswahl) */
  recentSteps?: number[];
  onDone?: () => void;
};

const empty = (today: string, s?: Runup): RunupInput => ({
  date: today,
  steps: s ? String(s.steps) : '',
  runup_m: toInput(s?.runup_m),
  grip_m: toInput(s?.grip_m),
  note: '',
});

/** Anlauf erfassen oder korrigieren. Vorausgefüllt mit dem letzten Anlauf, damit nur Änderungen getippt werden müssen. */
export function RunupForm({ today, entry, suggestion, recentSteps = [], onDone }: Props) {
  const [values, setValues] = useState<RunupInput>(() =>
    entry
      ? { date: entry.date, steps: String(entry.steps), runup_m: toInput(entry.runup_m), grip_m: toInput(entry.grip_m), note: entry.note }
      : empty(today, suggestion),
  );
  const [touched, setTouched] = useState(false);
  const [pending, start] = useTransition();
  const errors = touched ? validateRunup(values) : {};
  const set = (k: keyof RunupInput) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const idp = entry ? `edit-${entry.id}` : 'new';

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const errs = validateRunup(values);
    if (Object.keys(errs).length) return toast.error(Object.values(errs)[0]!);
    start(async () => {
      const res = await saveRunup(values, entry?.id);
      if (!res.ok) return toast.error(res.error);
      toast.success(res.message);
      if (!entry) setValues((v) => ({ ...v, note: '' }));
      setTouched(false);
      onDone?.();
    });
  }

  const field = (k: 'runup_m' | 'grip_m', label: string, hint: string, placeholder: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${idp}-${k}`} className="text-base">{label}</Label>
      <div className="flex items-center gap-3">
        <Input id={`${idp}-${k}`} inputMode="decimal" autoComplete="off" placeholder={placeholder} value={values[k]} onChange={set(k)}
          aria-invalid={Boolean(errors[k]) || undefined} aria-describedby={`${idp}-${k}-hint`} className="max-w-40" />
        <span className="text-sm text-muted-foreground">m</span>
      </div>
      <p id={`${idp}-${k}-hint`} className={cn('text-sm', errors[k] ? 'text-destructive' : 'text-muted-foreground')}>{errors[k] ?? hint}</p>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idp}-date`}>Datum</Label>
        <Input id={`${idp}-date`} type="date" value={values.date} max={today} onChange={set('date')} required className="max-w-56" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idp}-steps`} className="text-base">Anlauf in Schritten</Label>
        <div className="flex items-center gap-3">
          <Input id={`${idp}-steps`} inputMode="numeric" autoComplete="off" placeholder="z. B. 12" value={values.steps} onChange={set('steps')}
            aria-invalid={Boolean(errors.steps) || undefined} aria-describedby={`${idp}-steps-hint`} className="max-w-40" />
          <span className="text-sm text-muted-foreground">Schritte</span>
        </div>
        {recentSteps.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Zuletzt verwendet">
            {recentSteps.map((n) => (
              <button key={n} type="button" onClick={() => setValues((v) => ({ ...v, steps: String(n) }))}
                aria-pressed={values.steps === String(n)}
                className="h-9 min-w-11 rounded-full border px-3 text-sm font-medium transition-colors hover:bg-accent aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
                {n}
              </button>
            ))}
          </div>
        )}
        <p id={`${idp}-steps-hint`} className={cn('text-sm', errors.steps ? 'text-destructive' : 'text-muted-foreground')}>
          {errors.steps ?? 'Ganze Schritte (Pflichtfeld).'}
        </p>
      </div>

      {field('runup_m', 'Anlauf in Metern', 'Distanz vom Startpunkt bis zum Einstichkasten.', 'z. B. 18,5')}
      {field('grip_m', 'Griffhöhe in Metern', 'Vom unteren Stabende bis zur oberen Hand.', 'z. B. 3,40')}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idp}-note`}>Bemerkung <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id={`${idp}-note`} maxLength={200} placeholder="z. B. Stab 4,00 m / Gegenwind" value={values.note} onChange={set('note')} />
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        {pending ? 'Wird gespeichert …' : entry ? 'Änderung speichern' : 'Anlauf speichern'}
      </Button>
    </form>
  );
}
