'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tag,
  CalendarDays,
  CalendarRange,
  Bell,
  Settings,
  MoreVertical,
  FileBarChart,
} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';

export default function CashbookLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="가계부"
        data-testid="cashbook-header"
        rightSlot={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="더보기"
                data-testid="cashbook-more-menu"
              >
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push('/inner/cashbook/cashflow')}
                data-testid="menu-cashflow"
              >
                <CalendarRange size={16} className="mr-2" />
                현금흐름 캘린더
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/inner/cashbook/settlement')}
                data-testid="menu-settlement"
              >
                <FileBarChart size={16} className="mr-2" />
                월 결산
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/inner/cashbook/plan/annual')}
                data-testid="menu-annual-plan"
              >
                <CalendarDays size={16} className="mr-2" />
                연간 계획
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/inner/cashbook/categories')}
                data-testid="menu-categories"
              >
                <Tag size={16} className="mr-2" />
                카테고리 설정
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/inner/cashbook/history/weekly/notifications')}
                data-testid="menu-notifications"
              >
                <Bell size={16} className="mr-2" />
                알림 설정
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/inner/cashbook/settings')}
                data-testid="menu-cashbook-settings"
              >
                <Settings size={16} className="mr-2" />
                가계부 설정
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {children}
    </>
  );
}
