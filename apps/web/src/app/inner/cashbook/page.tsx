'use client';

import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { MascotLoader } from '@/components/MascotLoader';

/** 가계부 탭의 루트 — 예산 요약 대시보드. 여기서 내역/현금흐름/목표로 드릴다운하고, 점검은 내역 페이지에서 진입한다. */
export default function CashbookHomePage() {
  // 대시보드 필터를 URL 쿼리(useSearchParams)로 읽으므로 Suspense 경계가 필요하다
  return (
    <Suspense fallback={<MascotLoader fullScreen />}>
      <Dashboard />
    </Suspense>
  );
}
