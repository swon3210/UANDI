'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Button, EmptyState } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';

export default function OuterInvestmentPage() {
  return (
    <>
      <PageHeader data-testid="outer-investment-header" title="투자" />
      <main className="mx-auto max-w-md px-4 pb-20 pt-4">
        <EmptyState
          icon={<TrendingUp size={48} />}
          title="투자 관리 — v1.1에서 만나요"
          description="보유 종목과 평가액을 직접 기록하고 재테크 대시보드에서 합산해 볼 수 있어요."
          action={
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/outer/forex">환테크로 가기</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/outer">홈으로</Link>
              </Button>
            </div>
          }
        />
      </main>
    </>
  );
}
