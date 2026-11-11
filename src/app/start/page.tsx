import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAthlete, groupCodeRequired } from '@/lib/auth';
import { listAthletes } from '@/features/athletes/queries';
import { StartForm } from './start-form';

export const metadata = { title: 'Willkommen' };

export default async function StartPage() {
  if (await getAthlete()) redirect('/');
  const codeRequired = groupCodeRequired();
  const athletes = codeRequired ? null : (await listAthletes()).map((a) => a.name);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <Image src="/logo.svg" alt="Beyond Gravity – Pole Vaulting Team TV Dietlikon" width={160} height={74} priority unoptimized className="mb-3 h-16 w-auto self-start" />
          <CardTitle className="text-2xl">Willkommen!</CardTitle>
          <CardDescription>Einmal einrichten – danach merkt sich dein Handy, wer du bist.</CardDescription>
        </CardHeader>
        <CardContent>
          <StartForm codeRequired={codeRequired} initialAthletes={athletes} />
        </CardContent>
      </Card>
    </main>
  );
}
