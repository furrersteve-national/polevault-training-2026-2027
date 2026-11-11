'use client';

import { useEffect, useRef, useState } from 'react';
import { MicIcon, SquareIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fmtDuration, MAX_AUDIO_SECONDS } from '../types';

export type Recording = { blob: Blob; mime: string; seconds: number };

const PREFERRED = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  return PREFERRED.find((m) => MediaRecorder.isTypeSupported?.(m)) ?? '';
}

/** Sprachnachricht direkt im Browser aufnehmen (Handy-Mikrofon). Max. 5 Minuten. */
export function AudioRecorder({ value, onChange }: { value: Recording | null; onChange: (r: Recording | null) => void }) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSupported(typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia));
    return () => {
      if (timer.current) clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!value) return setPreview('');
    const url = URL.createObjectURL(value.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  async function start() {
    setError('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      setError(name === 'NotAllowedError'
        ? 'Kein Zugriff aufs Mikrofon. Bitte in den Browser-Einstellungen erlauben und nochmals versuchen.'
        : 'Das Mikrofon konnte nicht gestartet werden.');
      return;
    }
    const mime = pickMime();
    const r = mime ? new MediaRecorder(stream.current, { mimeType: mime }) : new MediaRecorder(stream.current);
    chunks.current = [];
    r.ondataavailable = (ev) => ev.data.size && chunks.current.push(ev.data);
    r.onstop = () => {
      const type = r.mimeType || mime || 'audio/webm';
      const seconds = Math.round((Date.now() - started.current) / 1000);
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      if (timer.current) clearInterval(timer.current);
      setRecording(false);
      const blob = new Blob(chunks.current, { type });
      if (blob.size > 0) onChange({ blob, mime: type, seconds });
    };
    rec.current = r;
    started.current = Date.now();
    setElapsed(0);
    r.start(1000);
    setRecording(true);
    timer.current = setInterval(() => {
      const s = Math.round((Date.now() - started.current) / 1000);
      setElapsed(s);
      if (s >= MAX_AUDIO_SECONDS) stop();
    }, 500);
  }

  function stop() {
    if (rec.current && rec.current.state !== 'inactive') rec.current.stop();
  }

  if (!supported) {
    return <p className="text-sm text-muted-foreground">Dein Browser kann keine Sprachnachrichten aufnehmen. Nutze stattdessen das Mikrofon der Tastatur zum Diktieren.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {recording ? (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive-soft px-3 py-2">
          <span className="relative flex size-3" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-destructive" />
          </span>
          <span className="flex-1 text-sm font-medium text-destructive tabular-nums" aria-live="polite">
            Aufnahme läuft · {fmtDuration(elapsed)} / {fmtDuration(MAX_AUDIO_SECONDS)}
          </span>
          <Button type="button" size="sm" variant="destructive" onClick={stop}><SquareIcon /> Stopp</Button>
        </div>
      ) : value ? (
        <div className="flex flex-col gap-1">
          <audio controls src={preview} className="h-10 w-full" preload="metadata" />
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>Neue Aufnahme · {fmtDuration(value.seconds)}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} className="hover:text-destructive">
              <Trash2Icon /> Verwerfen
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={start} className="w-fit">
          <MicIcon /> Sprachnachricht aufnehmen
        </Button>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
