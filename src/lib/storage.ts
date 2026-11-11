import 'server-only';
import { AppError, authHeaders, config } from './db';

// Supabase Storage (privater Bucket). Nur auf dem Server – der Browser bekommt nur kurzlebige, signierte Links.

async function call<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/${path}`, {
    method: init.method,
    headers: { ...authHeaders(key), 'Content-Type': 'application/json' },
    body: JSON.stringify(init.body ?? {}), // leerer JSON-Body nötig, sonst 400
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('Storage', res.status, path, text.slice(0, 300));
    let detail = '';
    try { detail = String(JSON.parse(text).message ?? '').slice(0, 120); } catch { /* kein JSON */ }
    throw Object.assign(new AppError(502, `Speicherfehler (${res.status}).`), { detail });
  }
  return (text ? JSON.parse(text) : null) as T;
}

/** Signierte Upload-Adresse: Der Browser lädt die Datei direkt dorthin hoch (einmalig, kurz gültig). */
export async function signedUploadUrl(bucket: string, objectPath: string): Promise<string> {
  const { url } = config();
  const res = await call<{ url: string }>(`object/upload/sign/${bucket}/${objectPath}`, { method: 'POST' });
  return `${url}/storage/v1${res.url}`;
}

/** Signierte Download-Adressen für mehrere Dateien (Standard: 2 Stunden gültig). */
export async function signedDownloadUrls(bucket: string, paths: string[], expiresIn = 7200): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!paths.length) return out;
  const { url } = config();
  try {
    const res = await call<{ path: string; signedURL: string | null; error: string | null }[]>(`object/sign/${bucket}`, {
      method: 'POST',
      body: { expiresIn, paths },
    });
    for (const r of res) if (r.signedURL) out.set(r.path, `${url}/storage/v1${r.signedURL}`);
  } catch (e) {
    console.error(e); // ohne Abspiel-Links weitermachen statt die Seite abbrechen
  }
  return out;
}

/** Dateien löschen (Fehler werden nur protokolliert). */
export async function removeObjects(bucket: string, paths: string[]) {
  if (!paths.length) return;
  try {
    await call(`object/${bucket}`, { method: 'DELETE', body: { prefixes: paths } });
  } catch (e) {
    console.error(e);
  }
}
