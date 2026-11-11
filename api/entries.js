const { rest, requireGroup, parseValue, parseDate, readBody, handler, httpError } = require('../lib/db');
const { loadExercises } = require('../lib/exercises');

async function activeAthlete(name) {
  const n = String(name || '').trim();
  if (!n) throw httpError(400, 'Bitte einen Namen wählen.');
  const rows = await rest(`athletes?select=name&active=eq.true&name=eq.${encodeURIComponent(n)}`);
  if (!rows.length) throw httpError(400, 'Unbekannter Name.');
  return n;
}

// GET  /api/entries?athlete=Svea   -> alle Einträge dieser Person
// POST /api/entries {athlete, date, values:{key:wert}} -> speichern (gleicher Tag + Übung wird überschrieben)
module.exports = handler(async (req) => {
  requireGroup(req);

  if (req.method === 'GET') {
    const athlete = await activeAthlete(req.query.athlete);
    const rows = await rest(
      `entries?select=date,exercise,value&athlete=eq.${encodeURIComponent(athlete)}&order=date.asc`
    );
    return { athlete, entries: rows };
  }

  if (req.method === 'POST') {
    const body = readBody(req);
    const athlete = await activeAthlete(body.athlete);
    const date = parseDate(body.date);
    const values = body.values && typeof body.values === 'object' ? body.values : {};
    const KEYS = new Set((await loadExercises()).map((e) => e.key));
    const rows = [];
    for (const [key, raw] of Object.entries(values)) {
      if (!KEYS.has(key)) continue;
      const value = parseValue(raw);
      if (value === null) continue;
      rows.push({ athlete, date, exercise: key, value });
    }
    if (!rows.length) throw httpError(400, 'Bitte mindestens ein Resultat eintragen.');
    await rest('entries?on_conflict=athlete,date,exercise', {
      method: 'POST',
      body: rows,
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    return { saved: rows.length };
  }

  throw httpError(405, 'Nicht erlaubt.');
});
