const { rest, handler } = require('../lib/db');

// GET /api/ping -> kleine Datenbankabfrage. Wird täglich von Vercel (Cron) aufgerufen,
// damit das Gratis-Projekt bei Supabase nicht wegen Inaktivität pausiert.
module.exports = handler(async () => {
  const rows = await rest('athletes?select=name&limit=1');
  return { ok: true, time: new Date().toISOString(), rows: rows.length };
});
