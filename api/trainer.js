const { rest, requireTrainer, parseDate, readBody, handler, httpError } = require('../lib/db');
const exercises = require('../lib/exercises');

// GET  /api/trainer -> alle Namen + alle Einträge
// POST /api/trainer {action, ...} -> Verwaltung
module.exports = handler(async (req) => {
  requireTrainer(req);

  if (req.method === 'GET') {
    const [athletes, entries] = await Promise.all([
      rest('athletes?select=name,active&order=name.asc'),
      rest('entries?select=id,athlete,date,exercise,value&order=date.asc,athlete.asc'),
    ]);
    return { athletes, entries, exercises };
  }

  if (req.method === 'POST') {
    const b = readBody(req);
    const name = String(b.name || '').trim();
    switch (b.action) {
      case 'addAthlete': {
        if (!name || name.length > 40) throw httpError(400, 'Bitte einen Namen (max. 40 Zeichen) eingeben.');
        await rest('athletes?on_conflict=name', {
          method: 'POST',
          body: [{ name, active: true }],
          prefer: 'resolution=merge-duplicates,return=minimal',
        });
        return { ok: true };
      }
      case 'setActive': {
        if (!name) throw httpError(400, 'Name fehlt.');
        await rest(`athletes?name=eq.${encodeURIComponent(name)}`, {
          method: 'PATCH',
          body: { active: !!b.active },
          prefer: 'return=minimal',
        });
        return { ok: true };
      }
      case 'deleteDay': {
        if (!name) throw httpError(400, 'Name fehlt.');
        const date = parseDate(b.date);
        await rest(`entries?athlete=eq.${encodeURIComponent(name)}&date=eq.${date}`, {
          method: 'DELETE',
          prefer: 'return=minimal',
        });
        return { ok: true };
      }
      default:
        throw httpError(400, 'Unbekannte Aktion.');
    }
  }

  throw httpError(405, 'Nicht erlaubt.');
});
