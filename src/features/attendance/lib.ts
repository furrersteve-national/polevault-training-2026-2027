// An-/Abmeldung und Anwesenheit: reine Logik (Server und Browser)

export type RsvpStatus = 'yes' | 'no';
export type Rsvp = { session_id: string; athlete: string; status: RsvpStatus; reason: string; updated_at?: string };
export type Presence = { session_id: string; athlete: string; present: boolean };

export type RosterRow = {
  athlete: string;
  rsvp: RsvpStatus; // ohne Eintrag: angemeldet (Standard)
  reason: string;
  present: boolean | null; // null = noch nicht erfasst
};

export function buildRoster(sessionId: string, athletes: string[], rsvps: Rsvp[], presence: Presence[]): RosterRow[] {
  const names = new Set(athletes);
  // Auch inzwischen inaktive Personen anzeigen, wenn sie für dieses Training Daten haben
  rsvps.filter((r) => r.session_id === sessionId).forEach((r) => names.add(r.athlete));
  presence.filter((p) => p.session_id === sessionId).forEach((p) => names.add(p.athlete));
  return [...names]
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map((athlete) => {
      const r = rsvps.find((x) => x.session_id === sessionId && x.athlete === athlete);
      const p = presence.find((x) => x.session_id === sessionId && x.athlete === athlete);
      return { athlete, rsvp: r?.status ?? 'yes', reason: r?.reason ?? '', present: p ? p.present : null };
    });
}

export type RosterSummary = {
  total: number;
  registered: number;
  declined: number;
  recorded: boolean; // Anwesenheit wurde erfasst
  present: number;
  noShow: number; // angemeldet, aber nicht gekommen
  cameAnyway: number; // abgemeldet, aber gekommen
};

export function summarize(roster: RosterRow[]): RosterSummary {
  const recorded = roster.some((r) => r.present !== null);
  return {
    total: roster.length,
    registered: roster.filter((r) => r.rsvp === 'yes').length,
    declined: roster.filter((r) => r.rsvp === 'no').length,
    recorded,
    present: roster.filter((r) => r.present === true).length,
    noShow: roster.filter((r) => r.rsvp === 'yes' && r.present === false).length,
    cameAnyway: roster.filter((r) => r.rsvp === 'no' && r.present === true).length,
  };
}
