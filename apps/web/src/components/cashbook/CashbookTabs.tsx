'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, ArrowRightLeft, Target } from 'lucide-react';
import { cn } from '@uandi/ui';

const TABS = [
  { id: 'dashboard', label: '대시보드', href: '/inner/cashbook', Icon: LayoutDashboard },
  { id: 'history', label: '내역', href: '/inner/cashbook/history', Icon: Receipt },
  { id: 'cashflow', label: '현금흐름', href: '/inner/cashbook/cashflow', Icon: ArrowRightLeft },
  { id: 'plan', label: '목표', href: '/inner/cashbook/plan/annual', Icon: Target },
] as const;

/**
 * 가계부 섹션 스위처. 대시보드(요약)·내역·현금흐름·목표 네 영역으로 이동한다.
 * "다른 영역으로 전환"이 분명히 드러나도록 아이콘+라벨 칩으로 표현하고,
 * 활성 섹션은 공간 톤(coral)으로 채워 하단 네비·기간 토글과 시각적으로 구분한다.
 * 대시보드는 정확 경로 매칭(루트에서만 활성), 나머지는 prefix 매칭이다.
 * 점검(/inner/cashbook/review)은 탭이 아니라 내역 페이지의 진입점으로 들어간다.
 */
export function CashbookTabs({ activePath }: { activePath?: string }) {
  const pathname = usePathname();
  const current = activePath ?? pathname ?? '';

  return (
    <div className="max-w-md mx-auto w-full px-4 pb-2 pt-3" data-testid="cashbook-tabs">
      <nav className="flex items-stretch gap-1.5" aria-label="가계부 메뉴">
        {TABS.map(({ id, label, href, Icon }) => {
          const isActive =
            id === 'dashboard'
              ? current === href
              : current === href || current.startsWith(`${href}/`);
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
