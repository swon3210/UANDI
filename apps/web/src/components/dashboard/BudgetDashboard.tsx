'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dayjs, { type Dayjs } from 'dayjs';
import { BookOpen, ChevronRight, Upload } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useDebounce } from '@uidotdev/usehooks';
import { buildCategoryColorMap, getCategoryColor } from '@uandi/cashbook-core';
import {
  Button,
  EmptyState,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from '@uandi/ui';
import {
  supportsSubGroup,
  useDashboardData,
  type GroupFilter,
  type SubGroupFilter,
} from '@/hooks/useDashboardData';
import type { AiReportStatus } from '@/components/cashbook/AiReportCard';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useCoupleMemberMap } from '@/hooks/useCoupleMembers';
import { useCategoryAnalysisData, useCategoryAnalysisReport } from '@/hooks/useCategoryAnalysis';
import { MEDIAN_COMPARE, useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useMonthlyMedianComparison } from '@/hooks/useMonthlyMedianComparison';
import type { CategoryGroup } from '@/types';
import {
  analysisScopeName,
  type AnalysisScopeLabels,
  buildCategoryAnalysisHref,
  composeOverallSummary,
  extractReportSummary,
  parseCategoryAnalysisParams,
  parseSummaryReasons,
  pickTopChanges,
} from '@/utils/category-analysis';
import { formatCurrency } from '@/utils/currency';
import { MEDIAN_MIN_SAMPLE_MONTHS, MEDIAN_WINDOW_MONTHS } from '@/utils/median-comparison';
import {
  dateFormat,
  getPeriodLabel,
  getPeriodRange,
  isCurrentPeriod,
  normalizeCursor,
  shiftPeriod,
  type PeriodKind,
} from '@/utils/date';
import { PeriodSelector } from './PeriodSelector';
import { PeriodNavigator } from './PeriodNavigator';
import { PeriodPicker } from './PeriodPicker';
import { GroupTabs } from './GroupTabs';
import { SubGroupTabs } from './SubGroupTabs';
import { CategoryDonutChart } from './CategoryDonutChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { IncomeExpenseMeter } from './IncomeExpenseMeter';
import { RecentEntriesCard } from './RecentEntriesCard';
import { PeriodCompareChart } from './PeriodCompareChart';
import { CompareAiSummary } from './CompareAiSummary';
import { CompareTargetPicker } from './CompareTargetPicker';
import {
  CompareCategorySheet,
  makeCategoryOption,
  type CompareCategoryOption,
} from './CompareCategorySheet';

type Props = {
  coupleId: string;
};

const TOTAL_COLOR: Record<CategoryGroup, string> = {
  expense: 'text-expense',
  income: 'text-income',
};

/**
 * 대시보드의 기간·그룹 상태를 내역 페이지 딥링크로 변환한다.
 * 월간은 월 스테퍼를 쓸 수 있도록 year/month로, 연간은 start/end(커스텀 기간)로 넘긴다.
 */
function buildHistoryHref(period: PeriodKind, cursor: Dayjs, group: CategoryGroup): string {
  const params = new URLSearchParams();
  if (period === 'monthly') {
    params.set('year', String(cursor.year()));
    params.set('month', String(cursor.month())); // 0-based
  } else {
    const { start, end } = getPeriodRange(period, cursor);
    params.set('start', dayjs(start).format('YYYY-MM-DD'));
    params.set('end', dayjs(end).format('YYYY-MM-DD'));
  }
  params.set('type', group);
  return `/inner/cashbook/history?${params.toString()}`;
}

export function BudgetDashboard({ coupleId }: Props) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  // 표시 라벨 (지출/수입, 고정/변동, 기간 선택기 제목) — 전부 messages/{locale}/dashboard.json
  const groupName = (g: 'expense' | 'income') => t(`group.${g}`);
  const subGroupPrefix = (s: Exclude<SubGroupFilter, 'all'>) =>
    t(s === 'fixed' ? 'subGroup.fixedShort' : 'subGroup.variableShort');
  const usualLabel = t('compare.usual');
  const scopeLabels: AnalysisScopeLabels = {
    all: (g, sg) =>
      sg === 'all'
        ? t('total.allGroup', { group: groupName(g) })
        : t('total.allSubGroup', { prefix: subGroupPrefix(sg), group: groupName(g) }),
    selectedCount: (count) => t('aiSummary.selectedCategories', { count }),
  };
  // 필터는 URL 쿼리에 저장해 다른 페이지에 다녀와도 유지한다
  const [filters, updateFilters] = useDashboardFilters();
  const { period, cursor, group, subGroup, compareSelection, categorySelection, donutSelection } =
    filters;

  const isDefaultCompare = compareSelection === null;
  // 평소(중위값) 비교는 월간 탭 전용. 연간 탭으로 바꾸면 비교 대상이 직전 기간으로 돌아간다.
  const isMedianCompare = compareSelection === MEDIAN_COMPARE;
  const compareCursor = dayjs.isDayjs(compareSelection)
    ? compareSelection
    : shiftPeriod(period, cursor, -1);

  // useDashboardData와 같은 쿼리 키라 추가 요청 없이 캐시를 공유한다.
  const { data: categories } = useCashbookCategories(coupleId);
  // 최근 내역 카드의 작성자 아바타용(커플 카드와 같은 쿼리를 공유한다)
  const memberMap = useCoupleMemberMap(coupleId);

  const {
    byCategory,
    byParent,
    typeTotals,
    byFixedVariable,
    total,
    hasEntries,
    recentEntries,
    comparison,
    isLoading,
    isCompareLoading,
  } = useDashboardData({
    coupleId,
    period,
    group,
    subGroup,
    cursor,
    compareCursor,
  });

  // 비교 대상을 "평소"(직전 6개월 중위값)로 골랐을 때만 지난 달들을 조회한다.
  const {
    comparison: medianComparison,
    medianOf,
    isLoading: isMedianLoading,
  } = useMonthlyMedianComparison({
    coupleId,
    cursor,
    group,
    subGroup,
    enabled: isMedianCompare && group !== 'all',
  });

  // 기간 단위/기준 기간이 바뀌면 비교 기간과 비교 대상 카테고리는 기본값으로 돌아간다.
  // (비교 기간만 바꿀 때는 고른 카테고리를 유지해 같은 카테고리를 여러 기간과 비교할 수 있게 한다)
  // 평소는 기준 달을 따라 움직이는 비교 대상이라 기준 달을 옮겨도 유지한다.
  const RESET_SELECTION = {
    compareSelection: isMedianCompare ? MEDIAN_COMPARE : null,
    categorySelection: null,
    donutSelection: [],
  } satisfies Partial<typeof filters>;

  // 월간↔연간 전환 시 각 탭에서 마지막으로 보던 기간을 복원한다.
  // 처음 여는 탭은 지금 보던 기간에서 파생한다(예: 2025년 3월 → 2025년).
  const handlePeriodChange = (next: PeriodKind) => {
    if (next === period) return;
    updateFilters({
      period: next,
      cursor: filters.altCursor ?? normalizeCursor(next, cursor),
      altCursor: cursor,
      ...RESET_SELECTION,
      compareSelection: null,
    });
  };
  const handleGroupChange = (next: GroupFilter) => {
    updateFilters({ group: next, subGroup: 'all', categorySelection: null, donutSelection: [] });
  };
  const handleSubGroupChange = (next: SubGroupFilter) => {
    updateFilters({ subGroup: next, categorySelection: null, donutSelection: [] });
  };
  const handlePrev = () => {
    updateFilters({ cursor: shiftPeriod(period, cursor, -1), ...RESET_SELECTION });
  };
  const handleNext = () => {
    if (!isCurrentPeriod(period, cursor)) {
      updateFilters({ cursor: shiftPeriod(period, cursor, 1), ...RESET_SELECTION });
    }
  };

  const handleOpenPicker = () => {
    overlay.open(({ isOpen, close, unmount }) => {
      const closeAndUnmount = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeAndUnmount()}>
          <SheetContent
            side="bottom"
            className="rounded-t-[20px] max-h-[90vh]"
            data-testid="period-picker-sheet"
          >
            <SheetHeader>
              <SheetTitle>{t(`period.pickTitle.${period}`)}</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <PeriodPicker
                kind={period}
                value={cursor}
                onSelect={(next) => {
                  updateFilters({ cursor: normalizeCursor(period, next), ...RESET_SELECTION });
                  closeAndUnmount();
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      );
    });
  };

  const handleOpenComparePicker = () => {
    overlay.open(({ isOpen, close, unmount }) => {
      const closeAndUnmount = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeAndUnmount()}>
          <SheetContent
            side="bottom"
            className="rounded-t-[20px] max-h-[90vh]"
            data-testid="compare-picker-sheet"
          >
            <SheetHeader>
              <SheetTitle>{t(`period.comparePickTitle.${period}`)}</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <CompareTargetPicker
                kind={period}
                value={isMedianCompare ? MEDIAN_COMPARE : compareCursor}
                defaultCursor={shiftPeriod(period, cursor, -1)}
                onSelectMedian={() => {
                  updateFilters({ compareSelection: MEDIAN_COMPARE });
                  closeAndUnmount();
                }}
                onSelectPeriod={(next) => {
                  const normalized = normalizeCursor(period, next);
                  // 직전 기간을 다시 고르면 기본값으로 되돌려 기간 이동 시에도 "직전 기간"을 따라가게 한다.
                  const isPrev = normalized.isSame(shiftPeriod(period, cursor, -1), 'day');
                  updateFilters({ compareSelection: isPrev ? null : normalized });
                  closeAndUnmount();
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      );
    });
  };

  const canGoNext = !isCurrentPeriod(period, cursor);
  const label = getPeriodLabel(period, cursor);
  // 현재 기간 카테고리는 도넛과 같은 색, 비교 기간에만 있는 카테고리는 카테고리에 지정된 색
  const categoryColors: Record<string, string> = Object.fromEntries(
    byCategory.map((c) => [c.category, c.color])
  );
  const colorMap = buildCategoryColorMap(categories);
  const colorOf = (name: string) =>
    categoryColors[name] ?? getCategoryColor(colorMap, group === 'all' ? 'expense' : group, name);
  // 카테고리 선택 시트 항목 (아이콘·상위/하위 묶음)
  const toOption = makeCategoryOption(categories, group === 'all' ? 'expense' : group);
  // 기간 비교 차트에 넣을 비교: 평소면 카테고리별 중위값, 아니면 비교 기간 금액
  const shownComparison = isMedianCompare ? (medianComparison ?? { rows: [] }) : comparison;
  const categoryOptions: CompareCategoryOption[] = shownComparison.rows.map((r) =>
    toOption(r.category, colorOf(r.category))
  );
  // 지출·수입은 고정/변동 합계를 기본으로 비교하므로 기본 선택이 없다
  const selectedCategories = categorySelection ?? [];

  // 지출·수입 '전체': 도넛은 기본 고정/변동, 고른 카테고리가 있으면 그 카테고리들만 (합계도 함께)
  const isGroupOverview = supportsSubGroup(group) && subGroup === 'all';
  const donutSlices = byCategory.filter((c) => donutSelection.includes(c.category));
  const isDonutFiltered = isGroupOverview && donutSlices.length > 0;
  const displayTotal = isDonutFiltered ? donutSlices.reduce((sum, c) => sum + c.amount, 0) : total;
  const donutOptions: CompareCategoryOption[] = byCategory.map((c) =>
    toOption(c.category, c.color)
  );

  const handleOpenDonutCategorySheet = () => {
    overlay.open(({ isOpen, close, unmount }) => {
      const closeAndUnmount = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeAndUnmount()}>
          <CompareCategorySheet
            title={t('donut.sheetTitle')}
            options={donutOptions}
            initialSelected={donutSlices.map((c) => c.category)}
            onApply={(names) => updateFilters({ donutSelection: names })}
            onClose={closeAndUnmount}
          />
        </Sheet>
      );
    });
  };

  // 기간 비교: 지출·수입 '전체'는 총액만, 고정/변동은 선택이 없을 때 그 합계 1줄로 비교한다
  const compareTotalRowLabel = supportsSubGroup(group)
    ? subGroup === 'all'
      ? t('total.allGroup', { group: groupName(group) })
      : t('total.allSubGroup', { prefix: subGroupPrefix(subGroup), group: groupName(group) })
    : undefined;
  // 지금 비교 중인 카테고리 (비교 데이터에 있는 것만). 비어 있으면 총액 비교 → 범위 전체
  const comparedCategories = isGroupOverview
    ? []
    : selectedCategories.filter((name) => shownComparison.rows.some((r) => r.category === name));

  // 평소 합계는 묶음 합계의 중위값이라 막대(카테고리별 중위값)의 합과 따로 구한다
  const compareTotal = isMedianCompare
    ? medianOf(comparedCategories.length > 0 ? comparedCategories : null)
    : undefined;
  const compareUnavailableMessage =
    isMedianCompare && !isMedianLoading && !medianComparison
      ? t('compare.medianUnavailable', { months: MEDIAN_MIN_SAMPLE_MONTHS })
      : undefined;
  // AI 종합 분석은 월간 탭 전용 (평소·월별 추이를 근거로 쓴다)
  const analysisHref =
    period === 'monthly' && supportsSubGroup(group)
      ? buildCategoryAnalysisHref({
          group,
          subGroup,
          cursor,
          categories: comparedCategories,
          compare: isMedianCompare ? 'median' : compareCursor,
        })
      : undefined;

  // AI 요약: 비교 중인 범위(분석 페이지와 같은 조건)를 1초 동안 그대로 두면 리포트를 만들고
  // 요약 섹션만 보여준다. 같은 쿼리 키라 "전체 리포트 보기"로 가면 다시 요청하지 않는다.
  const showSummary =
    analysisHref !== undefined &&
    !isLoading &&
    hasEntries &&
    !compareUnavailableMessage &&
    shownComparison.rows.length > 0;
  const summaryQuery = showSummary ? (analysisHref.split('?')[1] ?? '') : null;
  const debouncedSummaryQuery = useDebounce(summaryQuery, 1000);
  // 조건이 1초 동안 그대로일 때만 요청 대상이 된다
  const settledSummaryQuery =
    summaryQuery !== null && debouncedSummaryQuery === summaryQuery ? summaryQuery : null;
  const summaryParams = useMemo(
    () =>
      settledSummaryQuery === null
        ? null
        : parseCategoryAnalysisParams(new URLSearchParams(settledSummaryQuery)),
    [settledSummaryQuery]
  );
  const summaryScope = summaryParams ? analysisScopeName(summaryParams, scopeLabels) : null;
  const { data: summaryData } = useCategoryAnalysisData(coupleId, summaryParams);
  const summaryReport = useCategoryAnalysisReport(
    coupleId,
    summaryParams,
    summaryData && summaryData.rows.length > 0 ? summaryData : null,
    summaryScope?.scope ?? ''
  );
  const summary = extractReportSummary(summaryReport.data ?? '');
  // 막대는 지금 비교 중인 데이터로 바로 그리고, AI 요약 섹션의 한 줄 이유를 카테고리별로 붙인다
  const summaryReasons = parseSummaryReasons(summary.text);
  const summaryRows =
    comparedCategories.length > 0
      ? shownComparison.rows.filter((r) => comparedCategories.includes(r.category))
      : shownComparison.rows;
  const summaryItems = pickTopChanges(summaryRows).map((r) => ({
    ...r,
    color: colorOf(r.category),
    reason: summaryReasons.get(r.category),
  }));
  const summaryStatus: AiReportStatus = summaryReport.isError
    ? 'error'
    : summaryReport.isPending
      ? 'loading'
      : summary.complete || !summaryReport.isFetching
        ? 'success'
        : 'streaming';

  const handleOpenCategorySheet = () => {
    overlay.open(({ isOpen, close, unmount }) => {
      const closeAndUnmount = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeAndUnmount()}>
          <CompareCategorySheet
            options={categoryOptions}
            initialSelected={selectedCategories}
            onApply={(names) => updateFilters({ categorySelection: names })}
            onClose={closeAndUnmount}
          />
        </Sheet>
      );
    });
  };

  const baseTotalLabel =
    group === 'all'
      ? ''
      : supportsSubGroup(group) && subGroup !== 'all'
        ? t('total.withSubGroup', { prefix: subGroupPrefix(subGroup), label: t(`total.${group}`) })
        : t(`total.${group}`);
  const totalLabel = isDonutFiltered
    ? t('total.withCategories', { label: baseTotalLabel, count: donutSlices.length })
    : baseTotalLabel;

  return (
    <section className="space-y-3">
      <PeriodSelector value={period} onChange={handlePeriodChange} />
      <PeriodNavigator
        label={label}
        canGoNext={canGoNext}
        onPrev={handlePrev}
        onNext={handleNext}
        onLabelClick={handleOpenPicker}
      />
      <GroupTabs value={group} onChange={handleGroupChange} />
      {supportsSubGroup(group) ? (
        <SubGroupTabs
          groupLabel={groupName(group)}
          value={subGroup}
          onChange={handleSubGroupChange}
        />
      ) : null}

      {/* 전체 탭은 수입 대비 지출 게이지만 보여준다 (합계 카드·기간 비교 없음) */}
      {group !== 'all' ? (
        <Link
          href={buildHistoryHref(period, cursor, group)}
          data-testid="dashboard-total"
          className="block rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/40"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{totalLabel}</div>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              {t('viewHistory')}
              <ChevronRight size={14} />
            </span>
          </div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${TOTAL_COLOR[group]}`}>
            {formatCurrency(displayTotal)}
          </div>
        </Link>
      ) : null}

      {isLoading ? (
        <>
          <Skeleton className="h-[260px] w-full rounded-xl" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </>
      ) : !hasEntries ? (
        <div data-testid="dashboard-empty" className="rounded-xl border border-border bg-card p-6">
          <EmptyState
            icon={<BookOpen size={32} />}
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/inner/cashbook/import" data-testid="dashboard-import-link">
                  <Upload size={14} aria-hidden />
                  {t('empty.import')}
                </Link>
              </Button>
            }
          />
        </div>
      ) : group === 'all' ? (
        <>
          <div className="rounded-xl border border-border bg-card p-4">
            <IncomeExpenseMeter income={typeTotals.income} expense={typeTotals.expense} />
          </div>
          <RecentEntriesCard
            entries={recentEntries}
            categories={categories}
            historyHref="/inner/cashbook/history"
            authors={memberMap}
            onSelect={() => router.push('/inner/cashbook/history')}
          />
        </>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4">
            {isGroupOverview ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground" data-testid="donut-caption">
                    {isDonutFiltered
                      ? t('donut.selectedCategories', { count: donutSlices.length })
                      : t('donut.fixedVariable', { group: groupName(group) })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenDonutCategorySheet}
                    data-testid="donut-category-button"
                    className="h-7 gap-0.5 px-2 text-xs"
                  >
                    {t('donut.selectCategories')}
                    <ChevronRight size={14} />
                  </Button>
                </div>
                <CategoryDonutChart data={isDonutFiltered ? donutSlices : byFixedVariable} />
              </div>
            ) : (
              // 기간·그룹·세부 필터가 바뀌면 펼친 상위에서 다시 상위 화면으로
              <CategoryBreakdown
                key={`${period}-${cursor.valueOf()}-${group}-${subGroup}`}
                data={byParent}
              />
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <PeriodCompareChart
              comparison={shownComparison}
              isLoading={isMedianCompare ? isMedianLoading : isCompareLoading}
              group={group}
              currentLabel={label}
              compareLabel={isMedianCompare ? usualLabel : getPeriodLabel(period, compareCursor)}
              compareHint={
                isMedianCompare
                  ? t('compare.usualHint', { months: MEDIAN_WINDOW_MONTHS })
                  : isDefaultCompare
                    ? t(`period.prevHint.${period}`)
                    : undefined
              }
              compareTotal={compareTotal}
              unavailableMessage={compareUnavailableMessage}
              onCompareClick={handleOpenComparePicker}
              selectedCategories={isGroupOverview ? [] : selectedCategories}
              totalRowLabel={compareTotalRowLabel}
              onSelectCategoriesClick={isGroupOverview ? undefined : handleOpenCategorySheet}
            />
          </div>
          {showSummary ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <CompareAiSummary
                scopeTitle={
                  comparedCategories.length === 0
                    ? (compareTotalRowLabel ?? '')
                    : comparedCategories.length === 1
                      ? comparedCategories[0]
                      : t('aiSummary.selectedCategories', { count: comparedCategories.length })
                }
                compareLabel={
                  isMedianCompare ? usualLabel : compareCursor.format(dateFormat('monthShort'))
                }
                currentLabel={cursor.format(dateFormat('monthShort'))}
                group={group}
                items={summaryItems}
                overall={composeOverallSummary({
                  compareLabel: isMedianCompare
                    ? usualLabel
                    : getPeriodLabel(period, compareCursor),
                  currentTotal: summaryRows.reduce((sum, r) => sum + r.current, 0),
                  compareTotal: compareTotal ?? summaryRows.reduce((sum, r) => sum + r.compare, 0),
                  rows: summaryRows,
                })}
                status={summaryParams ? summaryStatus : 'loading'}
                errorMessage={summaryReport.error?.message}
                onRetry={() => summaryReport.refetch()}
                href={analysisHref}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
