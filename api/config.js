const { rest, requireGroup, handler, httpError } = require('../lib/db');
const { loadExercises } = require('../lib/exercises');

// GET /api/config -> aktive Namen + aktive Übungen
module.exports = handler(async (req) => {
  if (req.method !== 'GET') throw httpError(405, 'Nicht erlaubt.');
  requireGroup(req);
  const [rows, exercises] = await Promise.all([
    rest('athletes?select=name&active=eq.true&order=name.asc'),
    loadExercises(),
  ]);
  return { athletes: rows.map((r) => r.name), exercises };
});
