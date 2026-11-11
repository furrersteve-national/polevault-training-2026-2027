const { rest, requireTrainer, parseDate, readBody, handler, httpError } = require('../lib/db');
const { loadExercises, makeKey, cleanExercise, isMissingTable } = require('../lib/exercises');

const enc = encodeURIComponent;

async function exerciseRows() {
  try {
    return await rest('exercises?select=key,sort&order=sort.asc,label.asc');
  } catch (e) {
    if (isMissingTable(e)) throw httpError(400, 'Die Tabelle «exercises» fehlt noch. Bitte zuerst das SQL-Update in Supabase ausführen.');
    throw e;
  }
}

// GET  /api/trainer -> alle Namen, alle Übungen (auch ausgeblendete), alle Einträge
// POST /api/trainer {action, ...} -> Verwaltung
module.exports = handler(async (req) => {
  requireTrainer(req);

  if (req.method === 'GET') {
    const [athletes, entries, exercises] = await Promise.all([
      rest('athletes?select=name,active&order=name.asc'),
      rest('entries?select=id,athlete,date,exercise,value&order=date.asc,athlete.asc'),
      loadExercises({ all: true }),
    ]);
    return { athletes, entries, exercises };
  }

  if (req.method === 'POST') {
    const b = readBody(req);
    const name = String(b.name || '').trim();
    const key = String(b.key || '').trim();
    switch (b.action) {
      // --- Personen ---
      case 'addAthlete': {
        if (!name || name.length > 40) throw httpError(400, 'Bitte einen Namen (max. 40 Zeichen) eingeben.');
        await rest('athletes?on_conflict=name', {
          method: 'POST', body: [{ name, active: true }], prefer: 'resolution=merge-duplicates,return=minimal',
        });
        return { ok: true };
      }
      case 'setActive': {
        if (!name) throw httpError(400, 'Name fehlt.');
        await rest(`athletes?name=eq.${enc(name)}`, { method: 'PATCH', body: { active: !!b.active }, prefer: 'return=minimal' });
        return { ok: true };
      }
      case 'deleteDay': {
        if (!name) throw httpError(400, 'Name fehlt.');
        const date = parseDate(b.date);
        await rest(`entries?athlete=eq.${enc(name)}&date=eq.${date}`, { method: 'DELETE', prefer: 'return=minimal' });
        return { ok: true };
      }

      // --- Übungen ---
      case 'addExercise': {
        const ex = cleanExercise(b);
        const rows = await exerciseRows();
        const newKey = makeKey(ex.label, new Set(rows.map((r) => r.key)));
        const sort = rows.reduce((m, r) => Math.max(m, r.sort || 0), 0) + 10;
        await rest('exercises', { method: 'POST', body: [{ key: newKey, ...ex, sort, active: true }], prefer: 'return=minimal' });
        return { ok: true, key: newKey };
      }
      case 'updateExercise': {
        if (!key) throw httpError(400, 'Übung fehlt.');
        const ex = cleanExercise(b);
        await exerciseRows();
        await rest(`exercises?key=eq.${enc(key)}`, { method: 'PATCH', body: ex, prefer: 'return=minimal' });
        return { ok: true };
      }
      case 'setExerciseActive': {
        if (!key) throw httpError(400, 'Übung fehlt.');
        await exerciseRows();
        await rest(`exercises?key=eq.${enc(key)}`, { method: 'PATCH', body: { active: !!b.active }, prefer: 'return=minimal' });
        return { ok: true };
      }
      case 'moveExercise': {
        const rows = await exerciseRows();
        const i = rows.findIndex((r) => r.key === key);
        const j = b.dir === 'up' ? i - 1 : i + 1;
        if (i < 0) throw httpError(400, 'Unbekannte Übung.');
        if (j < 0 || j >= rows.length) return { ok: true };
        [rows[i], rows[j]] = [rows[j], rows[i]];
        // Reihenfolge neu durchnummerieren und nur geänderte Zeilen speichern
        await Promise.all(rows.map((r, idx) => ((idx + 1) * 10 !== r.sort
          ? rest(`exercises?key=eq.${enc(r.key)}`, { method: 'PATCH', body: { sort: (idx + 1) * 10 }, prefer: 'return=minimal' })
          : null)));
        return { ok: true };
      }
      case 'deleteExercise': {
        if (!key) throw httpError(400, 'Übung fehlt.');
        await exerciseRows();
        const used = await rest(`entries?select=id&exercise=eq.${enc(key)}&limit=1`);
        if (used.length) throw httpError(400, 'Zu dieser Übung gibt es schon Einträge. Blende sie stattdessen aus – so bleiben die Daten erhalten.');
        await rest(`exercises?key=eq.${enc(key)}`, { method: 'DELETE', prefer: 'return=minimal' });
        return { ok: true };
      }
      default:
        throw httpError(400, 'Unbekannte Aktion.');
    }
  }

  throw httpError(405, 'Nicht erlaubt.');
});
