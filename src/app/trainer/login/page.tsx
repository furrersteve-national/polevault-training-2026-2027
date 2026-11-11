import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isTrainer } from '@/lib/auth';
import { LoginForm } from './login-form';

export const metadata = { title: 'Trainer-Login' };

export default async function TrainerLoginPage() {
  if (await isTrainer()) redirect('/trainer');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <Image src="/logo.svg" alt="Beyond Gravity – Pole Vaulting Team TV Dietlikon" width={160} height={74} priority unoptimized className="mb-3 h-16 w-auto self-start" />
          <CardTitle className="text-2xl">Trainer-Bereich</CardTitle>
          <CardDescription>Du bleibst 30 Tage angemeldet.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
