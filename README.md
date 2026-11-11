# Beyond Gravity – Trainingsportal

Portal des Pole Vaulting Team TV Dietlikon: Trainingsplan mit An-/Abmeldung, Anwesenheit, Resultate und Verwaltung.

- **Athletinnen und Athleten:** `/` (Trainings, An-/Abmelden) und `/resultate`
- **Trainer:** `/trainer` (Passwort)

## Technik
- **Next.js 15** (App Router, Server Actions) + **TypeScript**
- **shadcn/ui** (Radix UI + Tailwind CSS 4) – Komponenten unter `src/components/ui`
- **Supabase** (Postgres) über die REST-API, nur serverseitig mit dem geheimen Schlüssel
- **Vercel** (Hosting) mit täglichem Cron `/api/ping`, damit Supabase nicht pausiert
- **GitHub Actions** baut jeden Push (`.github/workflows/ci.yml`)

## Aufbau (modular)
```
src/
  app/                    Seiten und Routen
    (athlete)/            Bereich Athletinnen/Athleten (Code + Name per Cookie)
    start/                Einstieg: Gruppen-Code -> Name
    trainer/              Trainer-Bereich (Passwort-Cookie)
    api/ping/             Cron für Supabase
  components/
    ui/                   shadcn/ui-Komponenten (Button, Card, Dialog, …)
    layout/               Header, Navigation
  features/               Ein Ordner pro Fachbereich
    athletes/             Personen
    exercises/            Übungen
    results/              Resultate, Diagramme
    sessions/             Trainingsplan
    attendance/           An-/Abmeldung und Anwesenheit
      queries.ts          Daten lesen (Server)
      actions.ts          Daten ändern (Server Actions)
      lib.ts / types.ts   Typen und reine Logik
      components/         UI des Bereichs
  lib/                    db, auth, Datum, Hilfsfunktionen
supabase/migrations/      SQL in Reihenfolge ausführen
```
Ein neues Feature = neuer Ordner unter `src/features/` + Seite unter `src/app/` + ggf. eine neue Migration.

## Design-System
Farben aus dem Logo, dezent eingesetzt (`src/app/globals.css`):
- **Navy** `#133159` – Marke, Primärfarbe, Überschriften
- **Gelb** `#f9dd29` – nur Akzent (z. B. «Heute», nächstes Training)
- **Stahlgrau** `#d6dce2` und abgeleitete Grautöne – Flächen und Linien
- Gedämpfte Statusfarben (Grün/Amber/Rot), Schrift Inter, Tabellenziffern

UX-Grundsätze (Nielsen-Heuristiken): Status immer sichtbar (Badges, Toasts), Sprache der Gruppe,
Rückgängig/Wiederanmelden mit einem Klick, Bestätigung bei folgenschweren Aktionen, Fehler verhindern
(Frist, Validierung), verständliche Fehlermeldungen, grosse Touch-Ziele und Daumen-Navigation auf dem Handy.

## Umgebungsvariablen (Vercel)
| Name | Zweck |
|---|---|
| `SUPABASE_URL` | Project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_…`) oder service_role |
| `TRAINER_PASSWORD` | Passwort Trainer-Bereich |
| `GROUP_CODE` | Gruppen-Code (leer = kein Code) |

## Datenbank
SQL-Dateien in `supabase/migrations/` der Reihe nach im Supabase SQL Editor ausführen (alle sind mehrfach ausführbar).
