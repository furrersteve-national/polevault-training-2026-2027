'use client';

import { Button } from '@/components/ui/button';

/** Fehlerseite mit verständlicher Meldung und Ausweg */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Etwas ist schiefgelaufen</h1>
      <p className="text-muted-foreground">
        Die Seite konnte nicht geladen werden. Versuche es nochmals – wenn es wieder passiert, melde dich beim Trainer.
      </p>
      {error.digest && <p className="text-xs text-muted-foreground">Fehlercode: {error.digest}</p>}
      <Button onClick={reset}>Nochmals versuchen</Button>
    </main>
  );
}
