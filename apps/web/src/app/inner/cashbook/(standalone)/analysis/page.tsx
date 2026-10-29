'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { SearchX } from 'lucide-react';
import { buildCategoryColorMap, getCategoryColor } from '@uandi/cashbook-core';
import { Button, EmptyState, Header, Skeleton } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { AiReportCard, type AiReportStatus } from '@/components/cashbook/AiReportCard';
import { CategoryAnalysisBreakdown } from '@/components/cashbook/CategoryAnalysisBreakdown';
import { CategoryAnalysisSummary } from '@/components/cashbook/CategoryAnalysisSummary';
import { CategoryTrendChart } from '@/components/cashbook/CategoryTrendChart';
import { TrendCategoryFilter } from '@/components/cashbook/TrendCategoryFilter';
import {
  compareTargetLabel,
  useCategoryAnalysisData,
  useCategoryAnalysisReport,
} from '@/hooks/useCategoryAnalysis';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import type { SubGroupFilter } from '@/hooks/useDashboardData';
import { userAtom } from '@/stores/auth.store';
import type { CategoryGroup } from '@/types';
import { analysisScopeName, parseCategoryAnalysisParams } from '@/utils/category-analysis';
import { formatCurrency } from '@/utils/currency';
import { getPeriodLabel } from '@/utils/date';
import { MEDIAN_UNAVAILABLE_MESSAGE, MEDIAN_WINDOW_MONTHS } from '@/utils/median-comparison';
import { BackButton } from '@/components/shell/BackButton';

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

  // 매 렌더 새 객체가 되면 아래 데이터 계산이 매번 다시 돌아 쿼리 키 문자열로 고정한다
  const query = searchParams.toString();
  const params = useMemo(() => parseCategoryAnalysisParams(new URLSearchParams(query)), [query]);
  const names = params ? analysisScopeName(params) : null;
  const { data, isLoading } = useCategoryAnalysisData(coupleId, params);
  const hasData = data !== null && data.rows.length > 0;
  const report = useCategoryAnalysisReport(
    coupleId,
    params,
    hasData ? data : null,
    names?.scope ?? ''
  );

  const { data: categories } = useCashbookCategories(coupleId);
  const colorMap = useMemo(() => buildCategoryColorMap(categories), [categories]);
  const colorOf = (name: string) => getCategoryColor(colorMap, params?.group ?? 'expense', name);

  // 추이 차트 카테고리 필터. null = 묶음 전체
  const [trendCategory, setTrendCategory] = useState<string | null>(null);
  const selectedTrend = data?.trends.find((t) => t.category === trendCategory) ?? null;
  const trendMedian = selectedTrend ? selectedTrend.median : (data?.median ?? null);

  // 스트리밍 중 매 청크마다 다시 렌더되므로 차트 데이터는 고정해 둔다
  const trendPoints = useMemo(
    () =>
      (data?.points ?? []).map((p, i) => ({
        label: p.cursor.format('M월'),
        amount: selectedTrend ? selectedTrend.amounts[i] : p.amount,
        isCurrent: p.isCurrent,
      })),
    [data, selectedTrend]
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
              description="대시보드 기간 비교의 'AI 분석'으로 들어와 주세요"
              action={
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                  뒤로 가기
                </Button>
              }
            />
          </div>
        ) : isLoading || !data || !names ? (
          <>
            <Skeleton className="h-[140px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-4">
              <CategoryAnalysisSummary
                title={names.title}
                categories={params.categories.map((name) => ({ name, color: colorOf(name) }))}
                group={params.group}
                monthLabel={getPeriodLabel('monthly', params.cursor)}
                currentAmount={data.currentAmount}
                compareLabel={compareTargetLabel(params.compare)}
                compareHint={
                  params.compare === 'median'
                    ? data.median !== null
                      ? `최근 ${data.sampleMonths}개월 중위값`
                      : undefined
                    : params.compare.isSame(params.cursor.subtract(1, 'month'), 'month')
                      ? '전월'
                      : undefined
                }
                compareAmount={data.compareAmount}
                unavailableMessage={MEDIAN_UNAVAILABLE_MESSAGE}
              />
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-card p-4">
              {data.trends.length > 1 ? (
                <TrendCategoryFilter
                  options={data.trends.map((t) => ({
                    name: t.category,
                    color: colorOf(t.category),
                  }))}
                  value={selectedTrend?.category ?? null}
                  onChange={setTrendCategory}
                />
              ) : null}
              <div
                data-testid="category-analysis-trend-caption"
                className="text-xs text-muted-foreground"
              >
                {selectedTrend?.category ?? '전체'} 최근 {MEDIAN_WINDOW_MONTHS}개월 추이
                {trendMedian !== null ? ` · 점선 = 평소 ${formatCurrency(trendMedian)}` : ''}
              </div>
              <CategoryTrendChart group={params.group} median={trendMedian} points={trendPoints} />
            </div>

            {data.rows.length > 1 ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <CategoryAnalysisBreakdown
                  group={params.group}
                  compareLabel={params.compare === 'median' ? '평소' : params.compare.format('M월')}
                  rows={data.rows.map((r) => ({ ...r, color: colorOf(r.category) }))}
                />
              </div>
            ) : null}

            {hasData ? (
              <AiReportCard
                content={report.data ?? ''}
                status={reportStatus}
                errorMessage={report.error?.message}
                onRetry={() => report.refetch()}
              />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
