'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { SearchX } from 'lucide-react';
import { Button, EmptyState, Header, Skeleton } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { AiReportCard, type AiReportStatus } from '@/components/cashbook/AiReportCard';
import { CategoryAnalysisSummary } from '@/components/cashbook/CategoryAnalysisSummary';
import { CategoryTrendChart } from '@/components/cashbook/CategoryTrendChart';
import { useCategoryAnalysisData, useCategoryAnalysisReport } from '@/hooks/useCategoryAnalysis';
import type { SubGroupFilter } from '@/hooks/useDashboardData';
import { userAtom } from '@/stores/auth.store';
import type { CategoryGroup, CashbookEntry } from '@/types';
import { parseCategoryAnalysisParams } from '@/utils/category-analysis';
import { formatCurrency } from '@/utils/currency';
import { formatDay, getPeriodLabel } from '@/utils/date';
import { MEDIAN_WINDOW_MONTHS } from '@/utils/median-comparison';
import { BackButton } from '@/components/shell/BackButton';

const SCOPE_LABEL: Record<Exclude<SubGroupFilter, 'all'>, Record<CategoryGroup, string>> = {
  fixed: { expense: '고정 지출', income: '고정 수입' },
  variable: { expense: '변동 지출', income: '변동 수입' },
};

function entryDate(entry: CashbookEntry): Date {
  return entry.date instanceof Date ? entry.date : entry.date.toDate();
}

export default function CategoryAnalysisPage() {
  // 카테고리·기준 달을 URL 쿼리(useSearchParams)로 읽으므로 Suspense 경계가 필요하다
  return (
    <Suspense fallback={<MascotLoader fullScreen />}>
      <CategoryAnalysisPageInner />
    </Suspense>
  );
}

function CategoryAnalysisPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  const params = parseCategoryAnalysisParams(searchParams);
  const { data, isLoading } = useCategoryAnalysisData(coupleId, params);
  const report = useCategoryAnalysisReport(coupleId, params, data);

  // 스트리밍 중 매 청크마다 다시 렌더되므로 차트 데이터는 고정해 둔다
  const trendPoints = useMemo(
    () =>
      (data?.points ?? []).map((p) => ({
        label: p.cursor.format('M월'),
        amount: p.amount,
        isCurrent: p.isCurrent,
      })),
    [data]
  );

  const reportStatus: AiReportStatus = report.isError
    ? 'error'
    : report.isPending
      ? 'loading'
      : report.isFetching
        ? 'streaming'
        : 'success';

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="카테고리 AI 분석"
        data-testid="category-analysis-header"
        leftSlot={<BackButton data-testid="category-analysis-back" />}
      />

      <main className="mx-auto w-full max-w-md flex-1 space-y-3 px-4 pb-20 pt-4">
        {!params ? (
          <div
            data-testid="category-analysis-empty"
            className="rounded-xl border border-border bg-card"
          >
            <EmptyState
              icon={<SearchX size={32} />}
              title="분석할 카테고리를 찾을 수 없어요"
              description="대시보드의 '평소와 비교'에서 카테고리를 골라 들어와 주세요"
              action={
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                  뒤로 가기
                </Button>
              }
            />
          </div>
        ) : isLoading || !data ? (
          <>
            <Skeleton className="h-[140px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-4">
              <CategoryAnalysisSummary
                category={params.category}
                group={params.group}
                monthLabel={getPeriodLabel('monthly', params.cursor)}
                scopeLabel={
                  params.subGroup === 'all' ? undefined : SCOPE_LABEL[params.subGroup][params.group]
                }
                currentAmount={data.currentAmount}
                median={data.median}
                sampleMonths={data.sampleMonths}
                windowMonths={MEDIAN_WINDOW_MONTHS}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 text-xs text-muted-foreground">
                최근 {MEDIAN_WINDOW_MONTHS}개월 추이
                {data.median !== null ? ` · 점선 = 평소 ${formatCurrency(data.median)}` : ''}
              </div>
              <CategoryTrendChart group={params.group} median={data.median} points={trendPoints} />
            </div>

            <AiReportCard
              content={report.data ?? ''}
              status={reportStatus}
              errorMessage={report.error?.message}
              onRetry={() => report.refetch()}
            />

            <section className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1 text-xs text-muted-foreground">
                이번 달 내역 {data.entries.length}건
              </div>
              {data.entries.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">이번 달엔 기록이 없어요</p>
              ) : (
                <ul data-testid="category-analysis-entries" className="divide-y divide-border">
                  {data.entries.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-12 shrink-0 text-xs text-muted-foreground">
                        {formatDay(entryDate(entry))}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {entry.description || dayjs(entryDate(entry)).format('M월 D일 내역')}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatCurrency(entry.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
