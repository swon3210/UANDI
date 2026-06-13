'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, CalendarRange, FileBarChart, CalendarDays } from 'lucide-react';
import { cn } from '@uandi/ui';

const TABS = [
  { id: 'history', label: '내역', href: '/inner/cashbook/history', Icon: Receipt },
  { id: 'cashflow', label: '캘린더', href: '/inner/cashbook/cashflow', Icon: CalendarRange },
  { id: 'settlement', label: '결산', href: '/inner/cashbook/settlement', Icon: FileBarChart },
  { id: 'plan', label: '계획', href: '/inner/cashbook/plan/annual', Icon: CalendarDays },
] as const;

/**
 * 가계부 섹션 스위처. 요약(대시보드)을 제외한 4개 영역(내역/캘린더/결산/계획)으로
 * 이동한다. "다른 영역으로 전환"이 분명히 드러나도록 아이콘+라벨 칩으로 표현하고,
 * 활성 섹션은 공간 톤(coral)으로 채워 하단 네비·기간 토글과 시각적으로 구분한다.
 * 활성 판정은 prefix 매칭이며, 요약 루트에서는 어떤 칩도 활성화되지 않는다.
 */
export function CashbookTabs({ activePath }: { activePath?: string }) {
  const pathname = usePathname();
  const current = activePath ?? pathname ?? '';

  return (
    <div className="max-w-md mx-auto w-full px-4 pb-2 pt-3" data-testid="cashbook-tabs">
      <nav className="flex items-stretch gap-1.5" aria-label="가계부 메뉴">
        {TABS.map(({ id, label, href, Icon }) => {
          const isActive = current === href || current.startsWith(`${href}/`);
          return (
            <Link
              key={id}
              href={href}
              data-testid={`cashbook-tab-${id}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon size={15} aria-hidden className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
