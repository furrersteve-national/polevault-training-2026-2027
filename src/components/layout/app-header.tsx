import Image from 'next/image';
import Link from 'next/link';

/** Kopfzeile: Logo links (führt zur Startseite), Aktionen rechts */
export function AppHeader({ title, href, children }: { title?: string; href: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
        <Link href={href} className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <Image src="/logo.svg" alt="Beyond Gravity – Pole Vaulting Team TV Dietlikon" width={96} height={44} priority unoptimized className="h-10 w-auto" />
          {title && (
            <span className="hidden border-l border-border pl-3 text-sm font-semibold text-navy-900 sm:inline">{title}</span>
          )}
        </Link>
        <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </header>
  );
}

export function PageTitle({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Einheitlicher Abmelden/Wechseln-Knopf im Header */
export const headerButtonClass =
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer';
