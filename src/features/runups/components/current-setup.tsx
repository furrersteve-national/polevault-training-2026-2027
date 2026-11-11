import { formatDate } from '@/lib/dates';
import { bestGrip, fmtM, latestBySteps, type Runup } from '../lib';

/** Aktueller Anlauf pro Schrittzahl – zum Nachschauen direkt an der Anlaufbahn */
export function CurrentSetup({ entries }: { entries: Runup[] }) {
  const setups = latestBySteps(entries);
  const best = bestGrip(entries);
  if (!setups.length) return null;
  const [main, ...others] = setups.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-l-4 border-l-highlight bg-card p-4">
        <p className="text-sm text-muted-foreground">Zuletzt erfasst am {formatDate(main.date)}</p>
        <dl className="mt-2 grid grid-cols-3 gap-3">
          <Stat label="Schritte" value={String(main.steps)} />
          <Stat label="Anlauf" value={fmtM(main.runup_m)} />
          <Stat label="Griffhöhe" value={fmtM(main.grip_m)} />
        </dl>
        {main.note && <p className="mt-2 text-sm text-muted-foreground">{main.note}</p>}
      </div>
      {(others.length > 0 || best) && (
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {others.map((r) => (
            <li key={r.steps}>
              <span className="font-medium text-foreground">{r.steps} Schritte:</span> Anlauf {fmtM(r.runup_m)}, Griff {fmtM(r.grip_m)}{' '}
              <span>({formatDate(r.date)})</span>
            </li>
          ))}
          {best && (
            <li>
              <span className="font-medium text-foreground">Höchste Griffhöhe:</span> {fmtM(best.grip_m)} ({formatDate(best.date)})
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-xl font-bold text-primary tabular-nums sm:text-2xl">{value}</dd>
    </div>
  );
}
