import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
      <p className="text-muted-foreground">Diese Seite gibt es nicht (mehr).</p>
      <Button asChild><Link href="/">Zur Startseite</Link></Button>
    </main>
  );
}
