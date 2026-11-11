'use server';

import { revalidatePath } from 'next/cache';
import { requireTrainer } from '@/lib/auth';
import { enc, rest } from '@/lib/db';
import { fail, run } from '@/lib/actions';

export async function addAthlete(rawName: string) {
  return run(async () => {
    await requireTrainer();
    const name = rawName.trim();
    if (!name || name.length > 40) fail('Bitte einen Namen (max. 40 Zeichen) eingeben.');
    await rest('athletes?on_conflict=name', {
      method: 'POST',
      body: [{ name, active: true }],
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    revalidatePath('/', 'layout');
  }, `${rawName.trim()} hinzugefügt.`);
}

export async function setAthleteActive(name: string, active: boolean) {
  return run(async () => {
    await requireTrainer();
    await rest(`athletes?name=eq.${enc(name)}`, { method: 'PATCH', body: { active }, prefer: 'return=minimal' });
    revalidatePath('/', 'layout');
  }, active ? `${name} ist wieder aktiv.` : `${name} ist jetzt inaktiv.`);
}
