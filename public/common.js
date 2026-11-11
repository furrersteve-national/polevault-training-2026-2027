// Gemeinsame Hilfsfunktionen für beide Seiten (ohne externe Bibliotheken)

const $ = (sel, root = document) => root.querySelector(sel);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch { /* leer */ }
  if (!res.ok) {
    const err = new Error(data.error || `Fehler ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function store(key, val) {
  try { if (val === undefined) return localStorage.getItem(key); if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch { return null; }
}

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function fmtDate(iso) {
  const [y, m, d] = String(iso).split('-');
  return `${d}.${m}.${y}`;
}

function fmtNum(n) {
  if (n === null || n === undefined || n === '') return '';
  const x = Math.round(Number(n) * 100) / 100;
  return String(x);
}

function fmtDelta(n) {
  if (n === null || n === undefined) return '';
  const s = fmtNum(Math.abs(n));
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : '±0';
}

// Werte einer Übung, nach Datum sortiert: [{date, value}]
function seriesFor(entries, exerciseKey) {
  return entries
    .filter((e) => e.exercise === exerciseKey)
    .map((e) => ({ date: e.date, value: Number(e.value) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function stats(series) {
  if (!series.length) return null;
  const values = series.map((p) => p.value);
  return {
    best: Math.max(...values),
    first: values[0],
    last: values[values.length - 1],
    delta: series.length > 1 ? values[values.length - 1] - values[0] : null,
    count: series.length,
    lastDate: series[series.length - 1].date,
  };
}

// Kleine Verlaufskurve (Sparkline) als SVG
function sparkline(series, w = 110, h = 30) {
  if (series.length < 2) return '';
  const vals = series.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = 3 + (i * (w - 6)) / (vals.length - 1);
    const y = h - 3 - ((v - min) * (h - 6)) / span;
    return [x.toFixed(1), y.toFixed(1)];
  });
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
    <polyline fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${pts.map((p) => p.join(',')).join(' ')}"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="currentColor"/></svg>`;
}

// Grösseres Liniendiagramm mit Achsenbeschriftung
function lineChart(series, unit, w = 520, h = 200) {
  if (!series.length) return '<p class="muted">Noch keine Werte.</p>';
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const vals = series.map((p) => p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min = Math.max(0, min - 1); max = max + 1; }
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const x = (i) => pad.l + (series.length === 1 ? iw / 2 : (i * iw) / (series.length - 1));
  const y = (v) => pad.t + ih - ((v - min) * ih) / (max - min);
  const ticks = [min, (min + max) / 2, max];
  const grid = ticks.map((t) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(t)}" y2="${y(t)}" class="grid"/>
    <text x="${pad.l - 6}" y="${y(t) + 4}" text-anchor="end" class="axis">${fmtNum(t)}</text>`).join('');
  const step = Math.max(1, Math.ceil(series.length / 6));
  const xl = series.map((p, i) => (i % step === 0 || i === series.length - 1)
    ? `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" class="axis">${fmtDate(p.date).slice(0, 5)}</text>` : '').join('');
  const path = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const dots = series.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="4" class="dot"><title>${fmtDate(p.date)}: ${fmtNum(p.value)} ${esc(unit)}</title></circle>`).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Verlauf">${grid}${xl}
    <path d="${path}" class="line"/>${dots}</svg>`;
}

const VALUE_RE = /^\d+([.,]\d+)?$/;
