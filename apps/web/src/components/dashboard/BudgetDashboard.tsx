'use client';

import { useState } from 'react';
import Link from 'next/link';
import dayjs, { type Dayjs } from 'dayjs';
import { BookOpen, ChevronRight } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { EmptyState, Sheet, SheetContent, SheetHeader, SheetTitle, Skeleton } from '@uandi/ui';
import {
  supportsSubGroup,
  useDashboardData,
  type GroupFilter,
  type SubGroupFilter,
} from '@/hooks/useDashboardData';
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
import { PeriodCompareChart } from './PeriodCompareChart';
import { CompareCategorySheet, type CompareCategoryOption } from './CompareCategorySheet';

type Props = {
  coupleId: string;
};

const TOTAL_LABEL: Record<GroupFilter, string> = {
  all: '순잔액',
  expense: '지출 합계',
  income: '수입 합계',
  flex: 'FLEX 합계',
};

const TOTAL_COLOR: Record<GroupFilter, string> = {
  all: 'text-foreground',
  expense: 'text-expense',
  income: 'text-income',
  flex: 'text-foreground',
};

const SUB_GROUP_PREFIX: Record<Exclude<SubGroupFilter, 'all'>, string> = {
  fixed: '고정',
  variable: '변동',
};

// 순잔액(전체 그룹)은 부호에 따라 지출/수입 합계와 동일한 색으로 표기한다.
function totalColorClass(group: GroupFilter, total: number): string {
  if (group === 'all') {
    if (total < 0) return 'text-expense';
    if (total > 0) return 'text-income';
    return 'text-foreground';
  }
  return TOTAL_COLOR[group];
}

// 기간 비교 차트에 기본으로 표시할 카테고리 수 (현재 기간 금액 상위)
const DEFAULT_COMPARE_TOP_N = 3;
// 비교 기간에만 있는(도넛 팔레트에 없는) 카테고리 칩 색
const FALLBACK_CHIP_COLOR = 'hsl(var(--muted-foreground))';

const PICKER_TITLE: Record<PeriodKind, string> = {
  weekly: '주 선택',
  monthly: '월 선택',
  yearly: '연도 선택',
};

const COMPARE_PICKER_TITLE: Record<PeriodKind, string> = {
  weekly: '비교할 주 선택',
  monthly: '비교할 월 선택',
  yearly: '비교할 연도 선택',
};

// 비교 기간 기본값(직전 기간)의 보조 라벨
const PREV_PERIOD_HINT: Record<PeriodKind, string> = {
  weekly: '전주',
  monthly: '전월',
  yearly: '전년',
};

/**
 * 대시보드의 기간·그룹 상태를 내역 페이지 딥링크로 변환한다.
 * 월간은 월 스테퍼를 쓸 수 있도록 year/month로, 주간·연간은 start/end(커스텀 기간)로 넘긴다.
 */
function buildHistoryHref(period: PeriodKind, cursor: Dayjs, group: GroupFilter): string {
  const params = new URLSearchParams();
  if (period === 'monthly') {
    params.set('year', String(cursor.year()));
    params.set('month', String(cursor.month())); // 0-based
  } else {
    const { start, end } = getPeriodRange(period, cursor);
    params.set('start', dayjs(start).format('YYYY-MM-DD'));
    params.set('end', dayjs(end).format('YYYY-MM-DD'));
  }
  if (group !== 'all') params.set('type', group);
  return `/inner/cashbook/history?${params.toString()}`;
}

export function BudgetDashboard({ coupleId }: Props) {
  const [period, setPeriod] = useState<PeriodKind>('weekly');
  const [group, setGroup] = useState<GroupFilter>('all');
  const [cursor, setCursor] = useState<Dayjs>(() => dayjs());
  const [subGroup, setSubGroup] = useState<SubGroupFilter>('all');
  // null = 기본(직전 기간), 값 = 사용자가 직접 고른 비교 기간
  const [compareSelection, setCompareSelection] = useState<Dayjs | null>(null);

  // null = 기본(현재 기간 상위 N개), 배열 = 사용자가 직접 고른 비교 대상 카테고리
  const [categorySelection, setCategorySelection] = useState<string[] | null>(null);

  const isDefaultCompare = compareSelection === null;
  const compareCursor = compareSelection ?? shiftPeriod(period, cursor, -1);

  const { byCategory, total, hasEntries, comparison, isLoading, isCompareLoading } =
    useDashboardData({
      coupleId,
      period,
      group,
      subGroup,
      cursor,
      compareCursor,
    });

  // 기간 단위/기준 기간이 바뀌면 비교 기간과 비교 대상 카테고리는 기본값으로 돌아간다.
  // (비교 기간만 바꿀 때는 고른 카테고리를 유지해 같은 카테고리를 여러 기간과 비교할 수 있게 한다)
  const resetCompareSelection = () => {
    setCompareSelection(null);
    setCategorySelection(null);
  };

  const handlePeriodChange = (next: PeriodKind) => {
    setPeriod(next);
    setCursor((prev) => normalizeCursor(next, prev));
    resetCompareSelection();
  };
  const handleGroupChange = (next: GroupFilter) => {
    setGroup(next);
    setSubGroup('all');
    setCategorySelection(null);
  };
  const handleSubGroupChange = (next: SubGroupFilter) => {
    setSubGroup(next);
    setCategorySelection(null);
  };
  const handlePrev = () => {
    setCursor((prev) => shiftPeriod(period, prev, -1));
    resetCompareSelection();
  };
  const handleNext = () => {
    if (!isCurrentPeriod(period, cursor)) {
      setCursor((prev) => shiftPeriod(period, prev, 1));
      resetCompareSelection();
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
                  setCursor(normalizeCursor(period, next));
                  resetCompareSelection();
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
                  setCompareSelection(isPrev ? null : normalized);
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
  const totalDisplay = group === 'all' ? total : Math.abs(total);
  const categoryColors: Record<string, string> = Object.fromEntries(
    byCategory.map((c) => [c.category, c.color])
  );
  const categoryOptions: CompareCategoryOption[] = comparison.rows.map((r) => ({
    name: r.category,
    color: categoryColors[r.category] ?? FALLBACK_CHIP_COLOR,
  }));
  const defaultCategorySelection = comparison.rows
    .slice(0, DEFAULT_COMPARE_TOP_N)
    .map((r) => r.category);
  const selectedCategories = categorySelection ?? defaultCategorySelection;

  const handleRemoveCategory = (name: string) => {
    setCategorySelection((prev) => (prev ?? defaultCategorySelection).filter((n) => n !== name));
  };

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
            onApply={setCategorySelection}
            onClose={closeAndUnmount}
          />
        </Sheet>
      );
    });
  };

  const totalLabel =
    supportsSubGroup(group) && subGroup !== 'all'
      ? `${SUB_GROUP_PREFIX[subGroup]} ${TOTAL_LABEL[group]}`
      : TOTAL_LABEL[group];

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
        <div
          className={`mt-1 text-2xl font-semibold tabular-nums ${totalColorClass(group, total)}`}
        >
          {formatCurrency(totalDisplay)}
        </div>
      </Link>

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
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4">
            <CategoryDonutChart data={byCategory} />
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
              categoryColors={categoryColors}
              selectedCategories={selectedCategories}
              onRemoveCategory={handleRemoveCategory}
              onSelectCategoriesClick={handleOpenCategorySheet}
            />
          </div>
        </>
      )}
    </section>
  );
}
