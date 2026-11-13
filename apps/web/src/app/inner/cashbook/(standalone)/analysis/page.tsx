'use client';

import { useCategoryLabels } from '@/i18n/cashbook-labels';
import { useTranslations } from 'next-intl';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { SearchX } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { buildCategoryColorMap, getCategoryColor } from '@uandi/cashbook-core';
import { Button, EmptyState, Header, Sheet, Skeleton } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { AiReportCard, type AiReportStatus } from '@/components/cashbook/AiReportCard';
import { CategoryAnalysisBreakdown } from '@/components/cashbook/CategoryAnalysisBreakdown';
import { CategoryAnalysisSummary } from '@/components/cashbook/CategoryAnalysisSummary';
import { CategoryTrendChart } from '@/components/cashbook/CategoryTrendChart';
import { TrendCategoryFilter } from '@/components/cashbook/TrendCategoryFilter';
import {
  CompareCategorySheet,
  makeCategoryOption,
} from '@/components/dashboard/CompareCategorySheet';
import {
  compareTargetLabel,
  useCategoryAnalysisData,
  useCategoryAnalysisReport,
} from '@/hooks/useCategoryAnalysis';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { userAtom } from '@/stores/auth.store';
import {
  analysisScopeName,
  type AnalysisScopeLabels,
  buildCategoryAnalysisHref,
  parseCategoryAnalysisParams,
} from '@/utils/category-analysis';
import { formatCurrency } from '@/utils/currency';
import { dateFormat, getPeriodLabel } from '@/utils/date';
import { MEDIAN_MIN_SAMPLE_MONTHS, MEDIAN_WINDOW_MONTHS } from '@/utils/median-comparison';
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
  const t = useTranslations('cashbook.analysis');
  const tDash = useTranslations('dashboard');
  const labels = useCategoryLabels();
  const scopeLabels = useMemo<AnalysisScopeLabels>(
    () => ({
      all: (group, subGroup) =>
        subGroup === 'all'
          ? tDash('total.allGroup', { group: labels.group(group) })
          : tDash('total.allSubGroup', {
              prefix: tDash(
                subGroup === 'fixed' ? 'subGroup.fixedShort' : 'subGroup.variableShort'
              ),
              group: labels.group(group),
            }),
      selectedCount: (count) => tDash('aiSummary.selectedCategories', { count }),
    }),
    [tDash, labels]
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  // 매 렌더 새 객체가 되면 아래 데이터 계산이 매번 다시 돌아 쿼리 키 문자열로 고정한다
  const query = searchParams.toString();
  const params = useMemo(() => parseCategoryAnalysisParams(new URLSearchParams(query)), [query]);
  const names = params ? analysisScopeName(params, scopeLabels) : null;
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

  // 분석할 카테고리를 다시 고르면 URL만 바꿔(기록 추가 없이) 그 묶음으로 다시 분석한다
  const handleOpenCategorySheet = () => {
    if (!params || !data) return;
    const toOption = makeCategoryOption(categories, params.group);
    const options = data.scopeCategories.map((name) => toOption(name, colorOf(name)));
    overlay.open(({ isOpen, close, unmount }) => {
      const closeAndUnmount = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeAndUnmount()}>
          <CompareCategorySheet
            title={t('sheetTitle')}
            options={options}
            initialSelected={params.categories}
            onApply={(names) =>
              router.replace(buildCategoryAnalysisHref({ ...params, categories: names }), {
                scroll: false,
              })
            }
            onClose={closeAndUnmount}
          />
        </Sheet>
      );
    });
  };

  // 추이 차트 카테고리 필터. null = 묶음 전체
  const [trendCategory, setTrendCategory] = useState<string | null>(null);
  const selectedTrend = data?.trends.find((t) => t.category === trendCategory) ?? null;
  const trendMedian = selectedTrend ? selectedTrend.median : (data?.median ?? null);

  // 스트리밍 중 매 청크마다 다시 렌더되지만 React Compiler 가 data·selectedTrend 기준으로 메모이즈한다
  const trendPoints = (data?.points ?? []).map((p, i) => ({
    label: p.cursor.format(dateFormat('monthShort')),
    amount: selectedTrend ? selectedTrend.amounts[i] : p.amount,
    isCurrent: p.isCurrent,
  }));

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
        title={t('title')}
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
              title={t('notFoundTitle')}
              description={t('notFoundDescription')}
              action={
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                  {t('goBack')}
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
                compareLabel={compareTargetLabel(params.compare, t('usual'))}
                compareHint={
                  params.compare === 'median'
                    ? data.median !== null
                      ? t('recentMedian', { months: data.sampleMonths })
                      : undefined
                    : params.compare.isSame(params.cursor.subtract(1, 'month'), 'month')
                      ? t('prevMonth')
                      : undefined
                }
                compareAmount={data.compareAmount}
                unavailableMessage={tDash('compare.medianUnavailable', {
                  months: MEDIAN_MIN_SAMPLE_MONTHS,
                })}
                onSelectCategories={handleOpenCategorySheet}
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
                {t('trendTitle', {
                  scope: selectedTrend?.category ?? t('all'),
                  months: MEDIAN_WINDOW_MONTHS,
                })}
                {trendMedian !== null
                  ? t('trendMedian', { amount: formatCurrency(trendMedian) })
                  : ''}
              </div>
              <CategoryTrendChart group={params.group} median={trendMedian} points={trendPoints} />
            </div>

            {data.rows.length > 1 ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <CategoryAnalysisBreakdown
                  group={params.group}
                  compareLabel={
                    params.compare === 'median'
                      ? t('usual')
                      : params.compare.format(dateFormat('monthShort'))
                  }
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
