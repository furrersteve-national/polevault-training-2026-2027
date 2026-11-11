'use server';

import { redirect } from 'next/navigation';
import { checkTrainerPassword, clearTrainer, setTrainer } from '@/lib/auth';

export async function trainerLogin(password: string): Promise<{ error: string }> {
  if (!checkTrainerPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // Raten erschweren
    return { error: 'Das Passwort stimmt nicht.' };
  }
  await setTrainer();
  redirect('/trainer');
}

export async function trainerLogout() {
  await clearTrainer();
  redirect('/trainer/login');
}
