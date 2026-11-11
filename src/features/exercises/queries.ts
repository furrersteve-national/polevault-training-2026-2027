import 'server-only';
import { isMissingTable, rest } from '@/lib/db';
import { DEFAULT_EXERCISES, type Exercise } from './types';

/** Übungen laden. all=true: auch ausgeblendete (für den Trainer). */
export async function loadExercises({ all = false } = {}): Promise<Exercise[]> {
  try {
    const rows = await rest<Exercise[]>(
      `exercises?select=key,label,unit,hint,sort,active${all ? '' : '&active=eq.true'}&order=sort.asc,label.asc`,
    );
    return rows.map((r) => ({ ...r, hint: r.hint || '' }));
  } catch (e) {
    if (isMissingTable(e)) {
      return all ? DEFAULT_EXERCISES : DEFAULT_EXERCISES.filter((d) => d.active);
    }
    throw e;
  }
}
