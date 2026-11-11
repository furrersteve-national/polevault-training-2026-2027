'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2Icon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { deleteDiary, prepareAudioUpload, saveDiary } from '../actions';
import { fmtDuration, MAX_TEXT, type DiaryEntry } from '../types';
import { AudioRecorder, type Recording } from './audio-recorder';

type Props = {
  sessionId: string;
  entry?: DiaryEntry;
  /** Platzhalter im Textfeld */
  prompt?: string;
  onDone?: () => void;
};

/** Schlankes Eingabefeld für einen Tagebucheintrag: Text, optional Sprachnachricht, Freigabe. */
export function DiaryComposer({ sessionId, entry, prompt = 'Wie lief das Training? Was nimmst du mit?', onDone }: Props) {
  const [text, setText] = useState(entry?.text ?? '');
  const [shared, setShared] = useState(entry?.shared ?? false);
  const [keepAudio, setKeepAudio] = useState(Boolean(entry?.audio_path));
  const [recording, setRecording] = useState<Recording | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [step, setStep] = useState('');
  const [pending, start] = useTransition();
  const id = `diary-${sessionId}`;

  function save() {
    if (!text.trim() && !recording && !keepAudio) {
      toast.error('Bitte etwas schreiben oder eine Sprachnachricht aufnehmen.');
      return;
    }
    start(async () => {
      let audio: { path: string; mime: string; seconds: number } | null | undefined;
      if (recording) {
        setStep('Wird hochgeladen …');
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
      setRecording(null);
      onDone?.();
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteDiary(sessionId);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(res.message);
      onDone?.();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id} className="sr-only">Tagebucheintrag</Label>
      <Textarea
        id={id}
        rows={4}
        maxLength={MAX_TEXT}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={prompt}
        className="text-base"
      />

      {entry?.audio_path && keepAudio && !recording ? (
        <div className="flex items-center gap-2">
          {entry.audioUrl
            ? <audio controls src={entry.audioUrl} className="h-10 min-w-0 flex-1" preload="none" aria-label="Gespeicherte Sprachnachricht" />
            : <span className="flex-1 text-sm text-muted-foreground">Sprachnachricht · {fmtDuration(entry.audio_seconds)}</span>}
          <Button type="button" size="icon" variant="ghost" onClick={() => setKeepAudio(false)} aria-label="Sprachnachricht entfernen" className="text-muted-foreground hover:text-destructive">
            <Trash2Icon />
          </Button>
        </div>
      ) : (
        <AudioRecorder value={recording} onChange={setRecording} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={`${id}-share`} className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Switch id={`${id}-share`} checked={shared} onCheckedChange={setShared} />
          <span>{shared ? 'Für Trainer:innen freigegeben' : 'Privat'}</span>
        </label>
        <div className="flex items-center gap-2">
          {entry && (confirmDelete ? (
            <>
              <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
              <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={remove}>Löschen</Button>
            </>
          ) : (
            <Button type="button" size="icon" variant="ghost" onClick={() => setConfirmDelete(true)} aria-label="Eintrag löschen" className="text-muted-foreground hover:text-destructive">
              <Trash2Icon />
            </Button>
          ))}
          <Button type="button" disabled={pending} onClick={save}>
            {pending && <Loader2Icon className="animate-spin" />}
            {pending ? step || 'Wird gespeichert …' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
