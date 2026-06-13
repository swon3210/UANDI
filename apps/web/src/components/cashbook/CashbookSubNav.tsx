'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@uandi/ui';

const TABS = [
  { label: '내역', href: '/inner/cashbook/history', exact: true },
  { label: '주간', href: '/inner/cashbook/history/weekly', exact: false },
  { label: '월간', href: '/inner/cashbook/history/monthly', exact: false },
] as const;

export function CashbookSubNav({ activePath }: { activePath?: string }) {
  const pathname = usePathname();
  // 앱에서는 usePathname, 스토리/테스트에서는 activePath로 활성 탭을 주입한다.
  const current = activePath ?? pathname ?? '';

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-2">
      <nav className="flex h-10 items-center bg-muted rounded-md">
        {TABS.map(({ label, href, exact }) => {
          const isActive = exact ? current === href : current.startsWith(href);
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
