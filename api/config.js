const { rest, requireGroup, handler, httpError } = require('../lib/db');
const exercises = require('../lib/exercises');

// GET /api/config -> aktive Namen + Übungen
module.exports = handler(async (req) => {
  if (req.method !== 'GET') throw httpError(405, 'Nicht erlaubt.');
  requireGroup(req);
  const rows = await rest('athletes?select=name&active=eq.true&order=name.asc');
  return { athletes: rows.map((r) => r.name), exercises };
});
