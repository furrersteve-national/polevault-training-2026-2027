// Ziele / Fokusthemen: woran eine Athletin als Nächstes arbeitet.
// Der Trainer setzt sie pro Athletin, die Athletin kann sie ergänzen, ändern und abhaken.

export type Goal = {
  id: number;
  athlete: string;
  text: string;
  done: boolean;
  created_by: 'trainer' | 'athlete';
  updated_by: 'trainer' | 'athlete';
  created_at: string;
  updated_at: string;
  done_at: string | null;
};

export const MAX_GOAL = 300;
