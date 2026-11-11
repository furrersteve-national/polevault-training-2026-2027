'use server';

import { redirect } from 'next/navigation';
import { checkGroupCode, clearAthlete, setAthlete } from '@/lib/auth';
import { fail, run } from '@/lib/actions';
import { isActiveAthlete, listAthletes } from '@/features/athletes/queries';

/** Schritt 1: Gruppen-Code prüfen, danach die Namen liefern */
export async function verifyCode(code: string) {
  return run(async () => {
    if (!checkGroupCode(code)) fail('Der Gruppen-Code stimmt nicht. Bitte beim Trainer nachfragen.');
    return (await listAthletes()).map((a) => a.name);
  });
}

/** Schritt 2: Name wählen -> Gerät merkt sich die Person */
export async function signIn(code: string, name: string) {
  const res = await run(async () => {
    if (!checkGroupCode(code)) fail('Der Gruppen-Code stimmt nicht.');
    if (!(await isActiveAthlete(name))) fail('Bitte deinen Namen aus der Liste wählen.');
    await setAthlete(name);
  });
  if (res.ok) redirect('/');
  return res;
}

export async function signOut() {
  await clearAthlete();
  redirect('/start');
}
