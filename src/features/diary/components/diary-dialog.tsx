'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { BookOpenIcon, Loader2Icon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { deleteDiary, prepareAudioUpload, saveDiary } from '../actions';
import { fmtDuration, MAX_TEXT, type DiaryEntry } from '../types';
import { AudioRecorder, type Recording } from './audio-recorder';

type Props = {
  sessionId: string;
  title: string;
  subtitle?: string;
  entry?: DiaryEntry;
  /** Darstellung des Auslösers */
  variant?: 'button' | 'link';
};

/** Tagebucheintrag zu einem Training schreiben oder einsprechen */
export function DiaryDialog({ sessionId, title, subtitle, entry, variant = 'button' }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(entry?.text ?? '');
  const [shared, setShared] = useState(entry?.shared ?? false);
  const [keepAudio, setKeepAudio] = useState(Boolean(entry?.audio_path));
  const [recording, setRecording] = useState<Recording | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [step, setStep] = useState('');
  const [pending, start] = useTransition();

  function reset(o: boolean) {
    if (pending) return;
    setOpen(o);
    if (o) {
      setText(entry?.text ?? '');
      setShared(entry?.shared ?? false);
      setKeepAudio(Boolean(entry?.audio_path));
      setRecording(null);
      setConfirmDelete(false);
    }
  }

  function save() {
    if (!text.trim() && !recording && !keepAudio) {
      toast.error('Bitte etwas schreiben oder eine Sprachnachricht aufnehmen.');
      return;
    }
    start(async () => {
      let audio: { path: string; mime: string; seconds: number } | null | undefined;
      if (recording) {
        setStep('Sprachnachricht wird hochgeladen …');
        const prep = await prepareAudioUpload(recording.mime);
        if (!prep.ok) { toast.error(prep.error); setStep(''); return; }
        const { path, uploadUrl, contentType } = prep.data!;
        try {
          const up = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': contentType, 'x-upsert': 'false' },
            body: new Blob([recording.blob], { type: contentType }),
          });
          if (!up.ok) throw new Error(String(up.status));
        } catch {
          toast.error('Die Sprachnachricht konnte nicht hochgeladen werden. Bitte Internetverbindung prüfen und nochmals versuchen.');
          setStep('');
          return;
        }
        audio = { path, mime: contentType, seconds: recording.seconds };
      } else if (entry?.audio_path && !keepAudio) {
        audio = null;
      }
      setStep('Wird gespeichert …');
      const res = await saveDiary({ sessionId, text, shared, audio });
      setStep('');
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(res.message);
      setOpen(false);
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteDiary(sessionId);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(res.message);
      setOpen(false);
    });
  }

  const label = entry ? 'Tagebuch bearbeiten' : 'Tagebuch schreiben';
  const Icon = entry ? PencilIcon : BookOpenIcon;

  return (
    <>
      {variant === 'button' ? (
        <Button variant={entry ? 'outline' : 'secondary'} onClick={() => reset(true)} className="w-full sm:w-fit">
          <Icon /> {label}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => reset(true)} aria-label={`${label}: ${title}`}>
          <Icon /> {entry ? 'Bearbeiten' : 'Tagebuch'}
        </Button>
      )}

      <Dialog open={open} onOpenChange={reset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tagebuch · {title}</DialogTitle>
            {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`diary-${sessionId}`} className="text-base">Wie lief das Training?</Label>
              <Textarea
                id={`diary-${sessionId}`}
                rows={6}
                maxLength={MAX_TEXT}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Was hat gut geklappt? Woran willst du arbeiten? Wie hast du dich gefühlt?"
                aria-describedby={`diary-${sessionId}-hint`}
              />
              <p id={`diary-${sessionId}-hint`} className="text-sm text-muted-foreground">
                Tipp: Mit dem Mikrofon auf der Handy-Tastatur kannst du auch diktieren.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-base font-medium">Sprachnachricht <span className="text-sm font-normal text-muted-foreground">(optional)</span></p>
              {entry?.audio_path && keepAudio && !recording ? (
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  {entry.audioUrl ? <audio controls src={entry.audioUrl} className="w-full" preload="none" /> : <p className="text-sm text-muted-foreground">Aufnahme gespeichert.</p>}
                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>Gespeichert · {fmtDuration(entry.audio_seconds)}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setKeepAudio(false)} className="hover:text-destructive">
                      <Trash2Icon /> Entfernen
                    </Button>
                  </div>
                </div>
              ) : (
                <AudioRecorder value={recording} onChange={setRecording} />
              )}
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div>
                <Label htmlFor={`share-${sessionId}`} className="text-base">Für Trainer freigeben</Label>
                <p className="text-sm text-muted-foreground">
                  {shared ? 'Der Trainer kann diesen Eintrag lesen und anhören.' : 'Privat – nur du siehst diesen Eintrag.'}
                </p>
              </div>
              <Switch id={`share-${sessionId}`} checked={shared} onCheckedChange={setShared} />
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
                    <Trash2Icon /> Eintrag löschen
                  </Button>
                )
              ) : <span />}
              <Button type="button" size="lg" disabled={pending} onClick={save} className={cn(pending && 'cursor-wait')}>
                {pending && <Loader2Icon className="animate-spin" />}
                {pending ? step || 'Wird gespeichert …' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
