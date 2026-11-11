# Stabhochsprung – Trainingsportal

Kleine Web-App: Athletinnen und Athleten tragen 1× pro Woche ihre Resultate ein und sehen ihre Bestleistungen. Der Trainer sieht unter `/trainer.html` die Übersicht aller Personen.

- **Hosting:** Vercel (gratis), ohne Framework und ohne Abhängigkeiten
- **Datenbank:** Supabase (gratis)
- **Täglicher Ping:** `vercel.json` ruft jeden Morgen `/api/ping` auf, damit Supabase das Projekt nicht wegen Inaktivität pausiert.

## Aufbau
| Datei | Zweck |
|---|---|
| `public/index.html` | Seite für Athletinnen und Athleten |
| `public/trainer.html` | Trainer-Bereich (Passwort) |
| `api/*.js` | Server-Funktionen (Vercel) |
| `lib/exercises.js` | Liste der Übungen – hier neue Übungen ergänzen |
| `supabase.sql` | Tabellen für Supabase |

## Umgebungsvariablen (Vercel → Settings → Environment Variables)
| Name | Wert |
|---|---|
| `SUPABASE_URL` | Project URL aus Supabase (z. B. `https://abcd.supabase.co`) |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_…`) oder legacy `service_role` key aus Supabase |
| `TRAINER_PASSWORD` | Passwort für den Trainer-Bereich |
| `GROUP_CODE` | Code für die Gruppe (optional; leer lassen = kein Code nötig) |

Nach dem Ändern von Variablen: in Vercel neu deployen (Deployments → … → Redeploy).
