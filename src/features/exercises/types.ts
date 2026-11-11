export type Exercise = {
  key: string;
  label: string;
  unit: string;
  hint: string;
  sort: number;
  active: boolean;
};

// Startliste – wird nur benutzt, falls die Tabelle "exercises" in Supabase noch fehlt.
export const DEFAULT_EXERCISES: Exercise[] = [
  { key: 'handstand', label: 'Handstandlaufen', unit: 'm', hint: 'Strecke im Handstand gehen, ohne umzufallen. In Metern.' },
  { key: 'kaefer', label: 'Käferlaufen', unit: 'Stk', hint: 'Anzahl saubere Wiederholungen am Stück.' },
  { key: 'hohlkoerper', label: 'Hohlkörperhalten', unit: 'Sek', hint: 'Rückenlage, Arme und Beine gestreckt knapp über dem Boden, unterer Rücken am Boden. Zeit in Sekunden.' },
  { key: 'klimmzuege', label: 'Klimmzüge', unit: 'Stk', hint: 'Ristgriff, aus dem gestreckten Hang, Kinn über die Stange, ohne Schwung. Anzahl am Stück.' },
  { key: 'liegestuetze', label: 'Liegestütze', unit: 'Stk', hint: 'Körper gerade wie ein Brett, Brust bis knapp über den Boden. Anzahl am Stück.' },
  { key: 'rumpfbeugen', label: 'Rumpfbeugen sauber', unit: 'Stk', hint: 'Kontrolliert und ohne Schwung. Anzahl am Stück.' },
  { key: 'sprossen_gestreckt', label: 'Sprossenwand: Beine gestreckt an Hände', unit: 'Stk', hint: 'Hang an der Sprossenwand, gestreckte Beine hoch, bis die Füsse die Hände berühren. Anzahl am Stück.' },
  { key: 'sprossen_gehockt', label: 'Sprossenwand: Knie gehockt hoch', unit: 'Stk', hint: 'Hang an der Sprossenwand, Knie so hoch wie möglich zur Brust ziehen. Anzahl am Stück.' },
].map((e, i) => ({ ...e, sort: (i + 1) * 10, active: true }));

export const UNIT_SUGGESTIONS = ['Stk', 'Sek', 'm', 'cm', 'kg'];
