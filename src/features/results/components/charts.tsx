import { formatDate } from '@/lib/dates';
import { fmtNum } from '@/lib/utils';
import type { Point } from '../lib';

/** Kleine Verlaufskurve ohne Achsen */
export function Sparkline({ series, className }: { series: Point[]; className?: string }) {
  if (series.length < 2) return null;
  const w = 300, h = 36;
  const vals = series.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => [3 + (i * (w - 6)) / (vals.length - 1), h - 4 - ((v - min) * (h - 8)) / span]);
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className ?? 'h-9 w-full text-primary'} aria-hidden="true">
      <polyline fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
        points={pts.map((p) => p.join(',')).join(' ')} />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill="currentColor" />
    </svg>
  );
}

/** Liniendiagramm mit Achsen und Datumsbeschriftung */
export function LineChart({ series, unit }: { series: Point[]; unit: string }) {
  if (!series.length) return <p className="text-sm text-muted-foreground">Noch keine Werte.</p>;
  const w = 560, h = 220, pad = { l: 40, r: 14, t: 14, b: 30 };
  const vals = series.map((p) => p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min = Math.max(0, min - 1); max = max + 1; }
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const x = (i: number) => pad.l + (series.length === 1 ? iw / 2 : (i * iw) / (series.length - 1));
  const y = (v: number) => pad.t + ih - ((v - min) * ih) / (max - min);
  const ticks = [min, (min + max) / 2, max];
  const step = Math.max(1, Math.ceil(series.length / 6));
  const d = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label={`Verlauf in ${unit}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="stroke-border" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{fmtNum(t)}</text>
        </g>
      ))}
      {series.map((p, i) =>
        i % step === 0 || i === series.length - 1 ? (
          <text key={p.date} x={x(i)} y={h - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
            {formatDate(p.date).slice(0, 5)}
          </text>
        ) : null,
      )}
      <path d={d} fill="none" className="stroke-primary" strokeWidth={2.5} strokeLinejoin="round" />
      {series.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.value)} r={4} className="fill-primary">
          <title>{`${formatDate(p.date)}: ${fmtNum(p.value)} ${unit}`}</title>
        </circle>
      ))}
    </svg>
  );
}
