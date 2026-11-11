import { BookOpenIcon, CalendarDaysIcon, LogOutIcon, RulerIcon, TrendingUpIcon } from 'lucide-react';
import { AppHeader, headerButtonClass } from '@/components/layout/app-header';
import { NavLink } from '@/components/layout/nav-link';
import { requireAthlete } from '@/lib/auth';
import { signOut } from '../start/actions';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/', label: 'Trainings', icon: CalendarDaysIcon, exact: true },
  { href: '/resultate', label: 'Resultate', icon: TrendingUpIcon },
  { href: '/stabdaten', label: 'Stabdaten', icon: RulerIcon },
  { href: '/tagebuch', label: 'Tagebuch', icon: BookOpenIcon },
];

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const name = await requireAthlete();
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader title="Training" href="/">
        <span className="hidden max-w-32 truncate px-1 font-medium text-foreground sm:inline">{name}</span>
        <form action={signOut}>
          <button type="submit" className={headerButtonClass}>
            <LogOutIcon className="size-4" aria-hidden /> <span className="sm:hidden">{name} ·</span> Wechseln
          </button>
        </form>
      </AppHeader>

      {/* Desktop: Navigation oben */}
      <nav aria-label="Hauptnavigation" className="hidden border-b bg-card sm:block">
        <div className="mx-auto flex max-w-3xl gap-1 px-4">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <NavLink key={href} href={href} exact={exact}
              className="inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              activeClassName="border-primary text-foreground">
              <Icon className="size-4" aria-hidden /> {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-28 sm:pb-10">{children}</main>

      {/* Handy: Navigation unten, gut mit dem Daumen erreichbar */}
      <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <NavLink key={href} href={href} exact={exact}
              className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground"
              activeClassName="text-primary">
              <Icon className="size-6" aria-hidden /> {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
