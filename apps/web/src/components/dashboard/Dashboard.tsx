'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { Button } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { NudgeButton } from '@/components/cashbook/NudgeButton';
import { useAuth } from '@/hooks/useAuth';
import { useCashbookEntryAutoOpen } from '@/hooks/useCashbookEntryAutoOpen';
import { BudgetDashboard } from './BudgetDashboard';
import { CoupleStatusSection } from './CoupleStatusSection';

export function Dashboard() {
  const { user } = useAuth();
  const coupleId = user?.coupleId;

  // 첫 진입 시 온보딩 투어 1회, 이후 그 해 목표가 없으면 목표 설정 화면 1회 자동 노출
  useCashbookEntryAutoOpen(coupleId ?? null);

  if (!coupleId) return null;

  return (
    <>
      <PageHeader
        title="대시보드"
        data-testid="dashboard-header"
        rightSlot={
          <Button asChild variant="ghost" size="sm" className="gap-1 px-2">
            <Link href="/inner/cashbook/history" data-testid="dashboard-history-link">
              <Receipt size={16} aria-hidden />
              내역
            </Link>
          </Button>
        }
      />
      <main className="w-full max-w-md mx-auto px-4 pb-20 pt-4 space-y-4">
        <CoupleStatusSection />
        <BudgetDashboard coupleId={coupleId} />
        <NudgeButton />
      </main>
    </>
  );
}
