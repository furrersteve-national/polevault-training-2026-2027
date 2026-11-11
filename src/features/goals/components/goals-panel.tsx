'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CheckIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ActionResult } from '@/lib/utils';
import { addGoal, deleteGoal, setGoalDone, updateGoal } from '../actions';
import { MAX_GOAL, type Goal } from '../types';

type Props = {
  goals: Goal[];
  /** Trainer-Ansicht: für diese Athletin handeln. Ohne: die angemeldete Athletin selbst. */
  forAthlete?: string;
  emptyText?: string;
};

/** Liste der Ziele mit Abhaken, Bearbeiten und Hinzufügen */
export function GoalsPanel({ goals, forAthlete, emptyText = 'Noch keine Ziele.' }: Props) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [newText, setNewText] = useState('');
  const open = goals.filter((g) => !g.done);
  const done = goals.filter((g) => g.done);
  const trainerView = forAthlete !== undefined;
  const idp = `goal-${forAthlete ?? 'me'}`.replace(/\W/g, '');

  function act(fn: () => Promise<ActionResult<unknown>>, after?: () => void) {
    start(async () => {
      const res = await fn();
      if (!res.ok) { toast.error(res.error); return; }
      if (res.message) toast.success(res.message);
      after?.();
    });
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    act(() => addGoal(newText, forAthlete), () => setNewText(''));
  }

  const sourceLabel = (g: Goal) =>
    trainerView
      ? g.created_by === 'athlete' ? 'selbst ergänzt' : g.updated_by === 'athlete' ? 'selbst angepasst' : ''
      : g.created_by === 'trainer' ? 'von den Trainer:innen' : '';

  return (
    <div className="flex flex-col gap-3">
      {open.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
      {open.length > 0 && (
        <ul className="flex flex-col gap-1">
          {open.map((g) => (
            <li key={g.id} className="group flex items-start gap-3 rounded-lg py-1.5">
              {editing === g.id ? (
                <form
                  className="flex w-full items-center gap-2"
                  onSubmit={(e) => { e.preventDefault(); act(() => updateGoal(g.id, draft, forAthlete), () => setEditing(null)); }}
                >
                  <Input autoFocus value={draft} maxLength={MAX_GOAL} onChange={(e) => setDraft(e.target.value)} aria-label="Ziel bearbeiten" />
                  <Button type="submit" size="icon" disabled={pending} aria-label="Speichern"><CheckIcon /></Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(null)} aria-label="Abbrechen"><XIcon /></Button>
                  <Button type="button" size="icon" variant="ghost" disabled={pending} aria-label="Ziel löschen"
                    onClick={() => act(() => deleteGoal(g.id, forAthlete), () => setEditing(null))}
                    className="text-muted-foreground hover:text-destructive">
                    <Trash2Icon />
                  </Button>
                </form>
              ) : (
                <>
                  <Checkbox
                    id={`${idp}-${g.id}`}
                    checked={false}
                    disabled={pending}
                    onCheckedChange={() => act(() => setGoalDone(g.id, true, forAthlete))}
                    aria-label={`«${g.text}» als erreicht markieren`}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug font-medium">{g.text}</p>
                    {sourceLabel(g) && <p className="text-xs text-muted-foreground">{sourceLabel(g)}</p>}
                  </div>
                  <Button type="button" size="icon" variant="ghost" aria-label={`«${g.text}» bearbeiten`}
                    onClick={() => { setEditing(g.id); setDraft(g.text); }}
                    className="-my-1 text-muted-foreground">
                    <PencilIcon />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex items-center gap-2">
        <Input
          value={newText}
          maxLength={MAX_GOAL}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={trainerView ? 'Neues Ziel, z. B. «Einstich mit gestrecktem Arm»' : 'Eigenes Ziel ergänzen …'}
          aria-label="Neues Ziel"
          className="bg-card"
        />
        <Button type="submit" variant="outline" disabled={pending || !newText.trim()} className="shrink-0">
          {pending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />} <span className="hidden sm:inline">Hinzufügen</span>
          <span className="sr-only sm:hidden">Hinzufügen</span>
        </Button>
      </form>

      {done.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-sm text-muted-foreground marker:hidden">
            Erreicht ({done.length}) <span className="ml-0.5 inline-block transition-transform group-open:rotate-180">▾</span>
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {done.map((g) => (
              <li key={g.id} className="flex items-start gap-3 py-1">
                <Checkbox
                  checked
                  disabled={pending}
                  onCheckedChange={() => act(() => setGoalDone(g.id, false, forAthlete))}
                  aria-label={`«${g.text}» wieder öffnen`}
                  className="mt-0.5"
                />
                <p className={cn('flex-1 text-sm leading-snug text-muted-foreground line-through')}>{g.text}</p>
                <Button type="button" size="icon" variant="ghost" disabled={pending} aria-label={`«${g.text}» löschen`}
                  onClick={() => act(() => deleteGoal(g.id, forAthlete))}
                  className="-my-1.5 text-muted-foreground hover:text-destructive">
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
