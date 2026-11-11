'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type Props = { href: string; children: React.ReactNode; exact?: boolean; also?: string; className?: string; activeClassName?: string };

/** Navigationslink, der die aktuelle Seite hervorhebt (Wo bin ich?) */
export function NavLink({ href, children, exact, also, className, activeClassName }: Props) {
  const path = usePathname();
  const active = (exact ? path === href : path === href || path.startsWith(`${href}/`)) || (also ? path.startsWith(also) : false);
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cn(className, active && activeClassName)}>
      {children}
    </Link>
  );
}
