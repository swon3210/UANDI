'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { SearchX } from 'lucide-react';
import { buildCategoryColorMap, getCategoryColor } from '@uandi/cashbook-core';
import { Button, EmptyState, Header, Skeleton } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { AiReportCard, type AiReportStatus } from '@/components/cashbook/AiReportCard';
import { CategoryAnalysisBreakdown } from '@/components/cashbook/CategoryAnalysisBreakdown';
import { CategoryAnalysisSummary } from '@/components/cashbook/CategoryAnalysisSummary';
import { CategoryTrendChart } from '@/components/cashbook/CategoryTrendChart';
import {
  compareTargetLabel,
  useCategoryAnalysisData,
  useCategoryAnalysisReport,
} from '@/hooks/useCategoryAnalysis';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import type { SubGroupFilter } from '@/hooks/useDashboardData';
import { userAtom } from '@/stores/auth.store';
import type { CategoryGroup, CashbookEntry } from '@/types';
import {
  parseCategoryAnalysisParams,
  type CategoryAnalysisParams,
} from '@/utils/category-analysis';
import { formatCurrency } from '@/utils/currency';
import { formatDay, getPeriodLabel } from '@/utils/date';
import { MEDIAN_UNAVAILABLE_MESSAGE, MEDIAN_WINDOW_MONTHS } from '@/utils/median-comparison';
import { BackButton } from '@/components/shell/BackButton';

const GROUP_NAME: Record<CategoryGroup, string> = { expense: '지출', income: '수입' };
const SUB_GROUP_PREFIX: Record<SubGroupFilter, string> = {
  all: '',
  fixed: '고정 ',
  variable: '변동 ',
};

/** 분석 범위 이름: 고른 카테고리가 있으면 그 이름들, 없으면 `전체 변동 지출` 같은 범위 */
function scopeName(params: CategoryAnalysisParams): { title: string; scope: string } {
  if (params.categories.length === 0) {
    const all = `전체 ${SUB_GROUP_PREFIX[params.subGroup]}${GROUP_NAME[params.group]}`;
    return { title: all, scope: all };
  }
  return {
    title:
      params.categories.length === 1
        ? params.categories[0]
        : `선택한 카테고리 ${params.categories.length}개`,
    scope: params.categories.join('·'),
  };
}

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

  // 매 렌더 새 객체가 되면 아래 데이터 계산이 매번 다시 돌아 쿼리 키 문자열로 고정한다
  const query = searchParams.toString();
  const params = useMemo(() => parseCategoryAnalysisParams(new URLSearchParams(query)), [query]);
  const names = params ? scopeName(params) : null;
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

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 text-xs text-muted-foreground">
                최근 {MEDIAN_WINDOW_MONTHS}개월 추이
                {data.median !== null ? ` · 점선 = 평소 ${formatCurrency(data.median)}` : ''}
              </div>
              <CategoryTrendChart group={params.group} median={data.median} points={trendPoints} />
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
                      {/* 여러 카테고리를 함께 보므로 어느 카테고리 내역인지 표시 */}
                      {params.categories.length !== 1 ? (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {entry.category}
                        </span>
                      ) : null}
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
