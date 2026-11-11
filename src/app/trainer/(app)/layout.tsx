import { BookOpenIcon, CalendarDaysIcon, LogOutIcon, RulerIcon, SettingsIcon, TargetIcon, TrendingUpIcon } from 'lucide-react';
import { AppHeader, headerButtonClass } from '@/components/layout/app-header';
import { NavLink } from '@/components/layout/nav-link';
import { requireTrainer } from '@/lib/auth';
import { trainerLogout } from '../actions';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/trainer', label: 'Trainings', icon: CalendarDaysIcon, exact: true, also: '/trainer/training' },
  { href: '/trainer/ziele', label: 'Ziele', icon: TargetIcon, exact: false, also: undefined },
  { href: '/trainer/resultate', label: 'Resultate', icon: TrendingUpIcon, exact: false, also: undefined },
  { href: '/trainer/stabdaten', label: 'Stabdaten', icon: RulerIcon, exact: false, also: undefined },
  { href: '/trainer/tagebuch', label: 'Tagebuch', icon: BookOpenIcon, exact: false, also: undefined },
  { href: '/trainer/verwaltung', label: 'Verwaltung', icon: SettingsIcon, exact: false, also: undefined },
];

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  await requireTrainer();
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader title="Trainer:innen-Bereich" href="/trainer">
        <form action={trainerLogout}>
          <button type="submit" className={headerButtonClass}>
            <LogOutIcon className="size-4" aria-hidden /> Abmelden
          </button>
        </form>
      </AppHeader>
      <nav aria-label="Navigation Trainer:innen" className="sticky top-14 z-20 border-b bg-card">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4">
          {NAV.map(({ href, label, icon: Icon, exact, also }) => (
            <NavLink
              key={href}
              href={href}
              exact={exact}
              also={also}
              className="inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              activeClassName="border-primary text-foreground"
            >
              <Icon className="size-4" aria-hidden /> {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
