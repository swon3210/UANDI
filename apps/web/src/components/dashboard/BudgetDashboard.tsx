'use client';

import Link from 'next/link';
import dayjs, { type Dayjs } from 'dayjs';
import { BookOpen, ChevronRight } from 'lucide-react';
import { overlay } from 'overlay-kit';
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
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useMonthlyMedianComparison } from '@/hooks/useMonthlyMedianComparison';
import type { CategoryGroup } from '@/types';
import { formatCurrency } from '@/utils/currency';
import {
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
import { PeriodCompareChart } from './PeriodCompareChart';
import { MedianCompareCard } from './MedianCompareCard';
import { CompareCategorySheet, type CompareCategoryOption } from './CompareCategorySheet';

type Props = {
  coupleId: string;
};

const TOTAL_LABEL: Record<CategoryGroup, string> = {
  expense: '지출 합계',
  income: '수입 합계',
};

const TOTAL_COLOR: Record<CategoryGroup, string> = {
  expense: 'text-expense',
  income: 'text-income',
};

const SUB_GROUP_PREFIX: Record<Exclude<SubGroupFilter, 'all'>, string> = {
  fixed: '고정',
  variable: '변동',
};

const GROUP_NAME: Record<'expense' | 'income', string> = {
  expense: '지출',
  income: '수입',
};

const PICKER_TITLE: Record<PeriodKind, string> = {
  monthly: '월 선택',
  yearly: '연도 선택',
};

const COMPARE_PICKER_TITLE: Record<PeriodKind, string> = {
  monthly: '비교할 월 선택',
  yearly: '비교할 연도 선택',
};

// 비교 기간 기본값(직전 기간)의 보조 라벨
const PREV_PERIOD_HINT: Record<PeriodKind, string> = {
  monthly: '전월',
  yearly: '전년',
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
  // 필터는 URL 쿼리에 저장해 다른 페이지에 다녀와도 유지한다
  const [filters, updateFilters] = useDashboardFilters();
  const { period, cursor, group, subGroup, compareSelection, categorySelection, donutSelection } =
    filters;

  const isDefaultCompare = compareSelection === null;
  const compareCursor = compareSelection ?? shiftPeriod(period, cursor, -1);

  // useDashboardData와 같은 쿼리 키라 추가 요청 없이 캐시를 공유한다.
  const { data: categories } = useCashbookCategories(coupleId);

  const {
    byCategory,
    byParent,
    typeTotals,
    byFixedVariable,
    total,
    hasEntries,
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

  // 월간 탭의 지출/수입에서만 "평소"(직전 6개월 중위값)와 비교한다. 연간·전체 탭에선 조회하지 않는다.
  const isMedianEnabled = period === 'monthly' && group !== 'all';
  const { comparison: medianComparison, isLoading: isMedianLoading } = useMonthlyMedianComparison({
    coupleId,
    cursor,
    group,
    subGroup,
    enabled: isMedianEnabled,
  });

  // 기간 단위/기준 기간이 바뀌면 비교 기간과 비교 대상 카테고리는 기본값으로 돌아간다.
  // (비교 기간만 바꿀 때는 고른 카테고리를 유지해 같은 카테고리를 여러 기간과 비교할 수 있게 한다)
  const RESET_SELECTION = {
    compareSelection: null,
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
              <SheetTitle>{PICKER_TITLE[period]}</SheetTitle>
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
              <SheetTitle>{COMPARE_PICKER_TITLE[period]}</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <PeriodPicker
                kind={period}
                value={compareCursor}
                onSelect={(next) => {
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
  // 카테고리 선택 시트의 상위/하위 묶음용: 현재 그룹 카테고리 이름 → 상위 카테고리 이름
  const groupCategories = (categories ?? []).filter((c) => c.group === group);
  const categoryById = new Map(groupCategories.map((c) => [c.id, c]));
  const parentOf = (name: string) => {
    const parentId = groupCategories.find((c) => c.name === name)?.parentCategoryId;
    return parentId ? categoryById.get(parentId) : undefined;
  };
  const iconOf = (name: string) => groupCategories.find((c) => c.name === name)?.icon;
  const toOption = (name: string, color: string): CompareCategoryOption => {
    const parent = parentOf(name);
    return {
      name,
      color,
      icon: iconOf(name),
      parent: parent?.name ?? null,
      parentIcon: parent?.icon,
      parentColor: parent?.color,
    };
  };
  const categoryOptions: CompareCategoryOption[] = comparison.rows.map((r) =>
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
            title="표시할 카테고리 선택"
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
      ? `전체 ${GROUP_NAME[group]}`
      : `전체 ${SUB_GROUP_PREFIX[subGroup]} ${GROUP_NAME[group]}`
    : undefined;

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
        ? `${SUB_GROUP_PREFIX[subGroup]} ${TOTAL_LABEL[group]}`
        : TOTAL_LABEL[group];
  const totalLabel = isDonutFiltered
    ? `${baseTotalLabel} (카테고리 ${donutSlices.length}개)`
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
          groupLabel={group === 'expense' ? '지출' : '수입'}
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
              내역 보기
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
            title="이 기간엔 내역이 없어요"
            description="다른 기간을 선택하거나 가계부에 내역을 추가해보세요"
          />
        </div>
      ) : group === 'all' ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <IncomeExpenseMeter income={typeTotals.income} expense={typeTotals.expense} />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4">
            {isGroupOverview ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground" data-testid="donut-caption">
                    {isDonutFiltered
                      ? `선택한 카테고리 ${donutSlices.length}개`
                      : `고정·변동 ${GROUP_NAME[group]}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenDonutCategorySheet}
                    data-testid="donut-category-button"
                    className="h-7 gap-0.5 px-2 text-xs"
                  >
                    카테고리 선택
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
              comparison={comparison}
              isLoading={isCompareLoading}
              group={group}
              currentLabel={label}
              compareLabel={getPeriodLabel(period, compareCursor)}
              compareHint={isDefaultCompare ? PREV_PERIOD_HINT[period] : undefined}
              onCompareClick={handleOpenComparePicker}
              selectedCategories={isGroupOverview ? [] : selectedCategories}
              totalRowLabel={compareTotalRowLabel}
              onSelectCategoriesClick={isGroupOverview ? undefined : handleOpenCategorySheet}
            />
          </div>
          {isMedianEnabled ? (
            <div className="rounded-xl border border-border bg-card p-4">
              {/* 기간·그룹·세부 필터가 바뀌면 펼친 "더 보기"도 접힌 상태로 */}
              <MedianCompareCard
                key={`${cursor.valueOf()}-${group}-${subGroup}`}
                comparison={medianComparison}
                isLoading={isMedianLoading}
                group={group}
                currentLabel={label}
                ongoingDay={isCurrentPeriod('monthly', cursor) ? dayjs().date() : undefined}
                colorOf={colorOf}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
