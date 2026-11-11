'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CheckIcon, ListChecksIcon, Loader2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { markAsRegistered, setPresence } from '../actions';
import type { RosterRow } from '../lib';

/**
 * Anwesenheit erfassen. Pro Person: angemeldet/abgemeldet (von der Person) und da/nicht da (vom Trainer).
 * Ein Klick auf die aktive Auswahl setzt sie zurück (Rückgängig).
 */
export function AttendanceList({ sessionId, roster, canRecord }: { sessionId: string; roster: RosterRow[]; canRecord: boolean }) {
  const [rows, setRows] = useState(roster);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const open = rows.filter((r) => r.present === null).length;

  // Serverdaten übernehmen, wenn sie sich ändern
  const [prev, setPrev] = useState(roster);
  if (prev !== roster) {
    setPrev(roster);
    setRows(roster);
  }

  function toggle(athlete: string, value: boolean) {
    const row = rows.find((r) => r.athlete === athlete)!;
    const next = row.present === value ? null : value;
    setRows((rs) => rs.map((r) => (r.athlete === athlete ? { ...r, present: next } : r)));
    setBusy(athlete);
    start(async () => {
      const res = await setPresence(sessionId, athlete, next);
      if (!res.ok) {
        toast.error(res.error);
        setRows((rs) => rs.map((r) => (r.athlete === athlete ? row : r)));
      }
      setBusy(null);
    });
  }

  function takeOver() {
    start(async () => {
      const res = await markAsRegistered(sessionId);
      if (res.ok) toast.success(res.data ? `${res.data} Personen erfasst.` : 'Alle sind schon erfasst.');
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {canRecord && open > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Noch {open} {open === 1 ? 'Person' : 'Personen'} nicht erfasst. Tipp: zuerst alle Angemeldeten als «da» übernehmen, dann Abweichungen anpassen.
          </p>
          <Button variant="secondary" onClick={takeOver} disabled={pending} className="shrink-0">
            {pending && !busy ? <Loader2Icon className="animate-spin" /> : <ListChecksIcon />} Anmeldungen übernehmen
          </Button>
        </div>
      )}
      {!canRecord && (
        <p className="text-sm text-muted-foreground">Die Anwesenheit kannst du ab dem Trainingstag erfassen.</p>
      )}

      <ul className="divide-y rounded-lg border">
        {rows.map((r) => (
          <li key={r.athlete} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{r.athlete}</span>
                {r.rsvp === 'yes' ? <Badge variant="success">angemeldet</Badge> : <Badge variant="muted">abgemeldet</Badge>}
                {r.rsvp === 'yes' && r.present === false && <Badge variant="warning">nicht gekommen</Badge>}
                {r.rsvp === 'no' && r.present === true && <Badge variant="secondary">trotzdem gekommen</Badge>}
              </div>
              {r.reason && <p className="mt-0.5 text-sm text-muted-foreground">Grund: {r.reason}</p>}
            </div>
            {canRecord && (
              <div className="flex shrink-0 gap-1.5" role="group" aria-label={`Anwesenheit ${r.athlete}`}>
                <Button
                  size="sm"
                  variant="outline"
                  aria-pressed={r.present === true}
                  disabled={busy === r.athlete}
                  onClick={() => toggle(r.athlete, true)}
                  className={cn('min-w-20', r.present === true && 'border-success bg-success text-white hover:bg-success/90 hover:text-white')}
                >
                  <CheckIcon /> Da
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-pressed={r.present === false}
                  disabled={busy === r.athlete}
                  onClick={() => toggle(r.athlete, false)}
                  className={cn('min-w-20', r.present === false && 'border-destructive bg-destructive text-white hover:bg-destructive/90 hover:text-white')}
                >
                  <XIcon /> Fehlt
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
