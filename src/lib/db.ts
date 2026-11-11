import 'server-only';

/** Fehler mit HTTP-Status und einer Meldung, die man der Person zeigen kann. */
export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function config() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = (process.env.SUPABASE_SECRET_KEY || '').trim();
  if (!url || !key) throw new AppError(500, 'Server nicht konfiguriert: SUPABASE_URL oder SUPABASE_SECRET_KEY fehlt.');
  return { url, key };
}

type RestOptions = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; prefer?: string };

/** Aufruf der Supabase-REST-API (PostgREST). Läuft nur auf dem Server – der geheime Schlüssel bleibt dort. */
export async function rest<T = unknown>(path: string, { method = 'GET', body, prefer }: RestOptions = {}): Promise<T> {
  const { url, key } = config();
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`; // alte JWT-Schlüssel
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('Supabase', res.status, path, text.slice(0, 500));
    if (/PGRST205|42P01|Could not find the table/i.test(text)) {
      throw new AppError(500, 'Eine Datenbanktabelle fehlt. Bitte das neueste SQL-Update in Supabase ausführen.');
    }
    throw new AppError(502, `Datenbankfehler (${res.status}).`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

export const enc = encodeURIComponent;

export const isMissingTable = (e: unknown) => e instanceof AppError && e.message.includes('Datenbanktabelle fehlt');

/** Wie rest(), liefert aber `fallback`, solange eine Tabelle noch nicht angelegt ist (SQL-Update fehlt). */
export async function restOr<T>(path: string, fallback: T): Promise<T> {
  try {
    return await rest<T>(path);
  } catch (e) {
    if (isMissingTable(e)) return fallback;
    throw e;
  }
}

/** Werte für PostgREST "in.(…)"-Filter sicher zusammensetzen */
export const inList = (values: string[]) => `(${values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',')})`;
