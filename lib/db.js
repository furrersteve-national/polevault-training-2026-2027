const crypto = require('crypto');

function cfg() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_SECRET_KEY || '';
  if (!url || !key) throw httpError(500, 'Server nicht konfiguriert: SUPABASE_URL oder SUPABASE_SECRET_KEY fehlt.');
  return { url, key };
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Aufruf der Supabase-REST-API (PostgREST). Der geheime Schlüssel bleibt auf dem Server.
async function rest(path, { method = 'GET', body, prefer } = {}) {
  const { url, key } = cfg();
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  // Alte Schlüssel (JWT "service_role") brauchen zusätzlich den Authorization-Header, neue (sb_secret_...) nicht.
  if (!key.startsWith('sb_')) headers.Authorization = 'Bearer ' + key;
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw httpError(502, `Datenbankfehler (${res.status}): ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Gruppen-Code für Athletinnen und Athleten (optional: ohne GROUP_CODE ist die Seite offen).
function requireGroup(req) {
  const code = process.env.GROUP_CODE;
  if (!code) return;
  if (!safeEqual(req.headers['x-code'], code)) throw httpError(401, 'Falscher Gruppen-Code.');
}

function requireTrainer(req) {
  const pw = process.env.TRAINER_PASSWORD;
  if (!pw) throw httpError(500, 'Server nicht konfiguriert: TRAINER_PASSWORD fehlt.');
  if (!safeEqual(req.headers['x-trainer'], pw)) throw httpError(401, 'Falsches Trainer-Passwort.');
}

// Zahl aus Eingabe lesen: akzeptiert "7.5" und "7,5". Leer = null.
function parseValue(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  if (!/^\d+(\.\d+)?$/.test(s)) throw httpError(400, `Ungültige Zahl: «${v}». Bitte nur Zahlen eintragen, z. B. 12 oder 7,5.`);
  const n = Number(s);
  if (!Number.isFinite(n) || n > 100000) throw httpError(400, `Ungültige Zahl: «${v}».`);
  return n;
}

function parseDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))) throw httpError(400, 'Bitte ein gültiges Datum wählen.');
  const t = Date.parse(d + 'T00:00:00Z');
  if (Number.isNaN(t)) throw httpError(400, 'Bitte ein gültiges Datum wählen.');
  const tomorrow = Date.now() + 2 * 86400000;
  if (t > tomorrow) throw httpError(400, 'Das Datum liegt in der Zukunft.');
  if (t < Date.parse('2020-01-01T00:00:00Z')) throw httpError(400, 'Das Datum ist zu alt.');
  return d;
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { throw httpError(400, 'Ungültige Anfrage.'); }
  }
  return {};
}

// Wrapper: einheitliche Fehlerbehandlung und JSON-Antworten.
function handler(fn) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const out = await fn(req, res);
      if (!res.headersSent) res.status(200).json(out ?? { ok: true });
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error(e);
      res.status(status).json({ error: e.message || 'Unbekannter Fehler' });
    }
  };
}

module.exports = { rest, requireGroup, requireTrainer, parseValue, parseDate, readBody, handler, httpError };
