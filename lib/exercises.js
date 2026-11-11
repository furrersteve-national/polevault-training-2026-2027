const { rest, httpError } = require('./db');

// Startliste – wird nur benutzt, falls die Tabelle "exercises" in Supabase noch nicht existiert.
const DEFAULTS = [
  { key: 'handstand', label: 'Handstandlaufen', unit: 'm', hint: 'Strecke im Handstand gehen, ohne umzufallen. In Metern.' },
  { key: 'kaefer', label: 'Käferlaufen', unit: 'Stk', hint: 'Anzahl saubere Wiederholungen am Stück.' },
  { key: 'hohlkoerper', label: 'Hohlkörperhalten', unit: 'Sek', hint: 'Rückenlage, Arme und Beine gestreckt knapp über dem Boden, unterer Rücken am Boden. Zeit in Sekunden.' },
  { key: 'klimmzuege', label: 'Klimmzüge', unit: 'Stk', hint: 'Ristgriff, aus dem gestreckten Hang, Kinn über die Stange, ohne Schwung. Anzahl am Stück.' },
  { key: 'liegestuetze', label: 'Liegestütze', unit: 'Stk', hint: 'Körper gerade wie ein Brett, Brust bis knapp über den Boden. Anzahl am Stück.' },
  { key: 'rumpfbeugen', label: 'Rumpfbeugen sauber', unit: 'Stk', hint: 'Kontrolliert und ohne Schwung. Anzahl am Stück.' },
  { key: 'sprossen_gestreckt', label: 'Sprossenwand: Beine gestreckt an Hände', unit: 'Stk', hint: 'Hang an der Sprossenwand, gestreckte Beine hoch, bis die Füsse die Hände berühren. Anzahl am Stück.' },
  { key: 'sprossen_gehockt', label: 'Sprossenwand: Knie gehockt hoch', unit: 'Stk', hint: 'Hang an der Sprossenwand, Knie so hoch wie möglich zur Brust ziehen. Anzahl am Stück.' },
].map((e, i) => ({ ...e, sort: (i + 1) * 10, active: true }));

const isMissingTable = (e) => /PGRST205|42P01|does not exist|Could not find the table/i.test(e.message);

// Übungen laden. all=true: auch ausgeblendete (für den Trainer).
async function loadExercises({ all = false } = {}) {
  try {
    const rows = await rest(`exercises?select=key,label,unit,hint,sort,active${all ? '' : '&active=eq.true'}&order=sort.asc,label.asc`);
    return rows.map((r) => ({ ...r, hint: r.hint || '' }));
  } catch (e) {
    if (isMissingTable(e)) return all ? DEFAULTS : DEFAULTS.filter((d) => d.active);
    throw e;
  }
}

// Aus einem Namen einen stabilen Schlüssel machen, z. B. "Käferlaufen" -> "kaeferlaufen"
function makeKey(label, existing) {
  const base = String(label).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'uebung';
  let key = base, n = 2;
  while (existing.has(key)) key = `${base}_${n++}`;
  return key;
}

function cleanExercise(b) {
  const label = String(b.label || '').trim();
  const unit = String(b.unit || '').trim();
  const hint = String(b.hint || '').trim();
  if (!label || label.length > 60) throw httpError(400, 'Bitte einen Namen für die Übung eingeben (max. 60 Zeichen).');
  if (!unit || unit.length > 10) throw httpError(400, 'Bitte eine Einheit eingeben, z. B. Stk, Sek, m (max. 10 Zeichen).');
  if (hint.length > 300) throw httpError(400, 'Die Beschreibung ist zu lang (max. 300 Zeichen).');
  return { label, unit, hint };
}

module.exports = { loadExercises, makeKey, cleanExercise, DEFAULTS, isMissingTable };
