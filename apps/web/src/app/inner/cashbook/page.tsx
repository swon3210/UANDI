'use client';

import { Dashboard } from '@/components/dashboard/Dashboard';

/** 가계부 탭의 루트 — 예산 요약 대시보드. 여기서 내역/현금흐름/목표로 드릴다운하고, 점검은 헤더에서 진입한다. */
export default function CashbookHomePage() {
  return <Dashboard />;
}
