'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2Icon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { deleteRunup, saveRunup } from '../actions';
import { toInput, validateRunup, type Runup, type RunupInput } from '../lib';

type Props = {
  /** Bestehende Karte – ohne: neu erfassen */
  entry?: Runup;
  /** Feste Schrittzahl (z. B. 3). null = wählen bzw. frei eingeben */
  steps: number | null;
  /** Auswahl, z. B. 10/12/14 für den ganzen Anlauf */
  choices?: readonly number[];
  onDone?: () => void;
};

/** Eine Stabdaten-Karte erfassen oder bearbeiten */
export function RunupForm({ entry, steps, choices, onDone }: Props) {
  const [values, setValues] = useState<RunupInput>({
    steps: entry ? String(entry.steps) : steps ? String(steps) : '',
    runup_m: toInput(entry?.runup_m),
    grip_m: toInput(entry?.grip_m),
    note: entry?.note ?? '',
  });
  const [touched, setTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const errors = touched ? validateRunup(values) : {};
  const set = (k: keyof RunupInput) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const idp = entry ? `r${entry.id}` : `new${steps ?? ''}`;
  const freeSteps = steps === null && !choices;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const errs = validateRunup(values);
    if (Object.keys(errs).length) {
      toast.error(Object.values(errs)[0]!);
      return;
    }
    start(async () => {
      const res = await saveRunup(values, entry?.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      onDone?.();
    });
  }

  function remove() {
    if (!entry) return;
    start(async () => {
      const res = await deleteRunup(entry.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      onDone?.();
    });
  }

  const meter = (k: 'runup_m' | 'grip_m', label: string, hint: string, placeholder: string) => (
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
      {choices && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-base font-medium">Schritte</legend>
          <div className="flex gap-2">
            {choices.map((n) => (
              <button key={n} type="button" onClick={() => setValues((v) => ({ ...v, steps: String(n) }))}
                aria-pressed={values.steps === String(n)}
                className="h-11 min-w-14 rounded-full border px-4 font-medium transition-colors hover:bg-accent aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
                {n}
              </button>
            ))}
          </div>
          {errors.steps && <p className="text-sm text-destructive">{errors.steps}</p>}
        </fieldset>
      )}
      {freeSteps && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idp}-steps`} className="text-base">Schritte</Label>
          <Input id={`${idp}-steps`} inputMode="numeric" autoComplete="off" placeholder="z. B. 5" value={values.steps} onChange={set('steps')}
            aria-invalid={Boolean(errors.steps) || undefined} className="max-w-40" />
          {errors.steps && <p className="text-sm text-destructive">{errors.steps}</p>}
        </div>
      )}

      {meter('runup_m', 'Anlauf', 'Vom Startpunkt bis zum Einstichkasten.', 'z. B. 18,5')}
      {meter('grip_m', 'Griffhöhe', 'Vom unteren Stabende bis zur oberen Hand.', 'z. B. 3,40')}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idp}-note`}>Bemerkung <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id={`${idp}-note`} maxLength={200} placeholder="z. B. Stab 4,00 m / 60 kg" value={values.note} onChange={set('note')} />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {entry ? (
          confirmDelete ? (
            <div className="flex gap-2">
              <Button type="button" variant="destructive" disabled={pending} onClick={remove}>Wirklich löschen</Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
            </div>
          ) : (
            <Button type="button" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2Icon /> Karte löschen
            </Button>
          )
        ) : <span />}
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" />}
          {pending ? 'Wird gespeichert …' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
