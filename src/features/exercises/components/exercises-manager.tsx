'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { addExercise, deleteExercise, moveExercise, setExerciseActive, updateExercise } from '../actions';
import { UNIT_SUGGESTIONS, type Exercise } from '../types';

type Draft = { label: string; unit: string; hint: string };
const empty: Draft = { label: '', unit: '', hint: '' };

export function ExercisesManager({ exercises, usedKeys }: { exercises: Exercise[]; usedKeys: string[] }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [deleting, setDeleting] = useState<Exercise | null>(null);

  const act = (p: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) =>
    start(async () => {
      const res = await p();
      if (res.ok) { if (res.message) toast.success(res.message); after?.(); } else toast.error(res.error);
    });

  const openEdit = (ex: Exercise | 'new') => {
    setDraft(ex === 'new' ? empty : { label: ex.label, unit: ex.unit, hint: ex.hint });
    setEditing(ex);
  };

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.label.trim() || !draft.unit.trim()) return void toast.error('Bitte Name und Einheit eingeben.');
    act(() => (editing === 'new' ? addExercise(draft) : updateExercise((editing as Exercise).key, draft)), () => setEditing(null));
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y rounded-lg border">
        {exercises.map((ex, i) => {
          const used = usedKeys.includes(ex.key);
          return (
            <li key={ex.key} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-2 sm:flex-1">
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon" className="size-7" aria-label={`${ex.label} nach oben`} disabled={pending || i === 0} onClick={() => act(() => moveExercise(ex.key, 'up'))}>
                    <ArrowUpIcon />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" aria-label={`${ex.label} nach unten`} disabled={pending || i === exercises.length - 1} onClick={() => act(() => moveExercise(ex.key, 'down'))}>
                    <ArrowDownIcon />
                  </Button>
                </div>
                <div className={cn('min-w-0 pt-1', !ex.active && 'opacity-50')}>
                  <p className="font-medium leading-tight">{ex.label} <span className="font-normal text-muted-foreground">({ex.unit})</span></p>
                  {ex.hint && <p className="mt-0.5 text-sm text-muted-foreground">{ex.hint}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-9 sm:pl-0">
                <Label htmlFor={`ex-${ex.key}`} className="font-normal text-muted-foreground">aktiv</Label>
                <Switch id={`ex-${ex.key}`} checked={ex.active} disabled={pending} onCheckedChange={(c) => act(() => setExerciseActive(ex.key, c))} />
                <Button variant="outline" size="sm" onClick={() => openEdit(ex)}><PencilIcon /> Bearbeiten</Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${ex.label} löschen`}
                  title={used ? 'Hat Einträge – bitte ausblenden statt löschen' : 'Löschen'}
                  disabled={used || pending}
                  onClick={() => setDeleting(ex)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <Button variant="secondary" className="self-start" onClick={() => openEdit('new')}><PlusIcon /> Neue Übung</Button>

      <Dialog open={editing !== null} onOpenChange={(o) => !pending && !o && setEditing(null)}>
        <DialogContent>
          <form onSubmit={save} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editing === 'new' ? 'Neue Übung' : 'Übung bearbeiten'}</DialogTitle>
              <DialogDescription>Die Übung erscheint sofort im Formular der Athlet:innen.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ex-label">Name *</Label>
              <Input id="ex-label" value={draft.label} maxLength={60} placeholder="z. B. Seilspringen" onChange={(e) => setDraft({ ...draft, label: e.target.value })} autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ex-unit">Einheit *</Label>
              <Input id="ex-unit" value={draft.unit} maxLength={10} list="unit-suggestions" placeholder="Stk, Sek, m …" onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
              <datalist id="unit-suggestions">{UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}</datalist>
              <div className="flex flex-wrap gap-1.5">
                {UNIT_SUGGESTIONS.map((u) => (
                  <Button key={u} type="button" size="sm" variant={draft.unit === u ? 'default' : 'outline'} onClick={() => setDraft({ ...draft, unit: u })}>{u}</Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ex-hint">Beschreibung <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="ex-hint" value={draft.hint} maxLength={300} placeholder="Wie wird die Übung ausgeführt und gemessen?" onChange={(e) => setDraft({ ...draft, hint: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={pending}>Abbrechen</Button>
              <Button type="submit" disabled={pending}>{pending && <Loader2Icon className="animate-spin" />} Speichern</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(o) => !pending && !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Übung «{deleting?.label}» löschen?</DialogTitle>
            <DialogDescription>Zu dieser Übung gibt es noch keine Einträge. Sie wird endgültig entfernt.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={pending}>Abbrechen</Button>
            <Button variant="destructive" disabled={pending} onClick={() => deleting && act(() => deleteExercise(deleting.key), () => setDeleting(null))}>
              {pending && <Loader2Icon className="animate-spin" />} Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
