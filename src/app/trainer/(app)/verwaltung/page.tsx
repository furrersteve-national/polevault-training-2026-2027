import { DownloadIcon } from 'lucide-react';
import { PageTitle } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { rest } from '@/lib/db';
import { listAthletes } from '@/features/athletes/queries';
import { AthletesManager } from '@/features/athletes/components/athletes-manager';
import { loadExercises } from '@/features/exercises/queries';
import { ExercisesManager } from '@/features/exercises/components/exercises-manager';

export const metadata = { title: 'Verwaltung' };

export default async function AdminPage() {
  const [athletes, exercises, used] = await Promise.all([
    listAthletes({ all: true }),
    loadExercises({ all: true }),
    rest<{ exercise: string }[]>('entries?select=exercise'),
  ]);
  const usedKeys = [...new Set(used.map((u) => u.exercise))];

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Verwaltung" description="Gruppe, Übungen und Export" />

      <Card>
        <CardHeader>
          <CardTitle>Athletinnen und Athleten</CardTitle>
          <CardDescription>Inaktive Personen erscheinen nicht mehr in der Auswahl. Ihre Daten bleiben gespeichert.</CardDescription>
        </CardHeader>
        <CardContent><AthletesManager athletes={athletes} /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Übungen</CardTitle>
          <CardDescription>
            Reihenfolge mit den Pfeilen ändern. «Aktiv» ausschalten blendet eine Übung aus – die Daten bleiben erhalten. Löschen geht nur bei Übungen ohne Einträge.
          </CardDescription>
        </CardHeader>
        <CardContent><ExercisesManager exercises={exercises} usedKeys={usedKeys} /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>Alle Resultate bzw. die Anwesenheit als CSV-Datei (öffnet in Excel oder Google Sheets).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href="/trainer/export?type=results" download><DownloadIcon /> Resultate</a></Button>
          <Button asChild variant="outline"><a href="/trainer/export?type=attendance" download><DownloadIcon /> Anwesenheit</a></Button>
          <Button asChild variant="outline"><a href="/trainer/export?type=runups" download><DownloadIcon /> Stabdaten</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}
