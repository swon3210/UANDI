'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@uandi/ui';

const TABS = [
  { label: '내역', href: '/cashbook', exact: true },
  { label: '주간', href: '/cashbook/weekly', exact: false },
  { label: '월간', href: '/cashbook/monthly', exact: false },
] as const;

export function CashbookSubNav() {
  const pathname = usePathname();

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-2">
      <nav className="flex h-10 items-center bg-muted rounded-md">
        {TABS.map(({ label, href, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 inline-flex items-center justify-center whitespace-nowrap px-3 py-3 text-sm font-medium transition-all border-b border-border',
                isActive
                  ? 'border-primary border-b-2 text-primary font-semibold'
                  : 'text-muted-foreground'
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
