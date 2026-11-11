import { formatTimeRange, zurichToDate } from '@/lib/dates';

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  end_time_late: string | null;
  phase: string;
  coach: string;
  content: string;
  location: string;
  status: 'planned' | 'cancelled';
  note: string;
};

export type SessionInput = Omit<Session, 'id'>;

/** Beginn des Trainings (Zürcher Zeit). Ohne Uhrzeit: Mitternacht am Trainingstag. */
export const sessionStart = (s: Pick<Session, 'date' | 'start_time'>) => zurichToDate(s.date, s.start_time ?? '00:00');

/** An-/Abmeldung ist bis Trainingsbeginn möglich */
export const rsvpLocked = (s: Pick<Session, 'date' | 'start_time'>, now = new Date()) => now >= sessionStart(s);

export const sessionTime = (s: Session) => formatTimeRange(s.start_time, s.end_time, s.end_time_late);
