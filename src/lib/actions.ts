import 'server-only';
import { AppError } from './db';
import type { ActionResult } from './utils';

/** Server-Action-Wrapper: wandelt Fehler in eine verständliche Meldung um. */
export async function run<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data, message };
  } catch (e) {
    // redirect()/notFound() von Next.js weiterreichen
    if (e && typeof e === 'object' && 'digest' in e && String((e as { digest: unknown }).digest).startsWith('NEXT_')) throw e;
    if (e instanceof AppError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: 'Unerwarteter Fehler. Bitte nochmals versuchen.' };
  }
}

export function fail(message: string, status = 400): never {
  throw new AppError(status, message);
}
