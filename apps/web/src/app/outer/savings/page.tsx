'use client';

import Link from 'next/link';
import { PiggyBank } from 'lucide-react';
import { Button, EmptyState } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';

export default function OuterSavingsPage() {
  return (
    <>
      <PageHeader data-testid="outer-savings-header" title="적금" />
      <main className="mx-auto max-w-md px-4 pb-20 pt-4">
        <EmptyState
          icon={<PiggyBank size={48} />}
          title="적금 트래커 — v1.1에서 만나요"
          description="적금 만기일과 이율을 한눈에 추적하고 재테크 대시보드에서 합산해 볼 수 있어요."
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
