'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { BookOpen } from 'lucide-react';
import { Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookEntriesInRange,
  useMonthlySummary,
  useFilteredEntries,
  useGroupedEntries,
  useAddEntry,
  useAddEntries,
  useUpdateEntry,
  useDeleteEntry,
  createDefaultFilterState,
  isDateSort,
  type CashbookFilterState,
} from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { resolvePeriod } from '@/utils/date';
import { CashbookFilterBar } from '@/components/cashbook/CashbookFilterBar';
import { CashbookFilterSheet } from '@/components/cashbook/CashbookFilterSheet';
import { MonthlySummary } from '@/components/cashbook/MonthlySummary';
import { EntryList } from '@/components/cashbook/EntryList';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { AiParseInput } from '@/components/cashbook/AiParseInput';
import { AiBulkPreviewSheet } from '@/components/cashbook/AiBulkPreviewSheet';
import { AiSpendingAnalysis } from '@/components/cashbook/AiSpendingAnalysis';
import { formatAmount } from '@/utils/currency';
import { parseEntriesFromText, analyzeSpending } from '@/services/ai';
import type { CashbookEntry, CashbookEntryType } from '@/types';

/**
 * 필터 시트를 쿼리 캐시의 최신 카테고리로 렌더한다.
 * overlay-kit은 open 시점의 props를 클로저로 캡처하므로, 카테고리 로드 전에 열면
 * 빈 목록이 고정되는 레이스가 있다. 시트 안에서 훅을 구독해 로드 완료 시 자동 갱신한다.
 */
function FilterSheetContent({
  coupleId,
  initial,
  onApply,
  onClose,
}: {
  coupleId: string | null;
  initial: CashbookFilterState;
  onApply: (next: CashbookFilterState) => void;
  onClose: () => void;
}) {
  const { data: categories } = useCashbookCategories(coupleId);
  return (
    <CashbookFilterSheet
      categories={categories ?? []}
      initial={initial}
      onApply={onApply}
      onClose={onClose}
    />
  );
}

export default function CashbookPage() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const [filter, setFilter] = useState<CashbookFilterState>(createDefaultFilterState);
  const range = useMemo(() => resolvePeriod(filter.period), [filter.period]);

  const isFilterActive =
    filter.typeFilter !== 'all' ||
    filter.selectedCategoryNames.length > 0 ||
    filter.keyword.trim() !== '';

  const activeFilterCount =
    (filter.typeFilter !== 'all' ? 1 : 0) +
    (filter.selectedCategoryNames.length > 0 ? 1 : 0) +
    (filter.keyword.trim() !== '' ? 1 : 0);

  // 단일 캘린더 월(month 모드)일 때만 월 단위 AI 분석을 노출한다.
  const isSingleMonthPeriod = filter.period.mode === 'month';

  const { data: entries, isLoading: entriesLoading } = useCashbookEntriesInRange(
    coupleId,
    range.start,
    range.end
  );
  const { data: categories, isLoading: categoriesLoading } = useCashbookCategories(coupleId);
  const isLoading = entriesLoading || categoriesLoading;
  const summary = useMonthlySummary(entries);
  const filteredEntries = useFilteredEntries(
    entries,
    filter.typeFilter,
    filter.selectedCategoryNames,
    filter.keyword
  );
  const filterSummary = useMonthlySummary(filteredEntries);
  const groups = useGroupedEntries(filteredEntries, filter.sort);

  // 예산 알림 토스트는 항상 현재 달 기준(신규 내역 기본 날짜=오늘).
  const now = useMemo(() => dayjs(), []);
  const { notifyTransition } = useBudgetAlerts(coupleId, now.year(), now.month() + 1);

  // 인라인 월 이동 스테퍼는 month 모드일 때만 노출되며, 이번 달 이후로는 이동 불가.
  const canGoNext =
    filter.period.mode === 'month' &&
    !(filter.period.year === now.year() && filter.period.month === now.month());

  const handlePrevMonth = () => {
    if (filter.period.mode !== 'month') return;
    const prev = dayjs(new Date(filter.period.year, filter.period.month, 1)).subtract(1, 'month');
    setFilter((f) => ({ ...f, period: { mode: 'month', year: prev.year(), month: prev.month() } }));
  };

  const handleNextMonth = () => {
    if (filter.period.mode !== 'month' || !canGoNext) return;
    const next = dayjs(new Date(filter.period.year, filter.period.month, 1)).add(1, 'month');
    setFilter((f) => ({ ...f, period: { mode: 'month', year: next.year(), month: next.month() } }));
  };

  const openFilterSheet = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <FilterSheetContent
          coupleId={coupleId}
          initial={filter}
          onApply={setFilter}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleAllFiltersReset = () => {
    setFilter(createDefaultFilterState());
  };

  const addMutation = useAddEntry(coupleId);
  const addManyMutation = useAddEntries(coupleId);
  const updateMutation = useUpdateEntry(coupleId);
  const deleteMutation = useDeleteEntry(coupleId);

  const handleAdd = (prefill?: {
    type?: CashbookEntryType;
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
  }) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          coupleId={coupleId}
          createdBy={uid}
          prefill={prefill}
          onSubmit={(data) => addMutation.mutate(data, { onSuccess: () => notifyTransition(data) })}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  // 푸시 알림 딥링크(quickAdd=1)로 진입하면 prefill된 추가 시트를 1회 자동으로 연다.
  // 카테고리 로드 후 열어야 prefill 카테고리가 선택되므로 categories를 기다린다.
  // 외부 트리거(URL)에 반응하는 일회성 동작이라 effect + ref 가드를 사용한다.
  const searchParams = useSearchParams();
  const quickAddHandledRef = useRef(false);
  useEffect(() => {
    if (quickAddHandledRef.current) return;
    if (searchParams.get('quickAdd') !== '1') return;
    if (!categories) return;
    quickAddHandledRef.current = true;

    const qaType = searchParams.get('qaType');
    const type: CashbookEntryType =
      qaType === 'income' || qaType === 'flex' ? qaType : 'expense';
    const amountRaw = searchParams.get('qaAmount');
    const amount =
      amountRaw && Number.isFinite(Number(amountRaw)) ? Number(amountRaw) : undefined;

    handleAdd({
      type,
      category: searchParams.get('qaCategory') ?? undefined,
      amount,
    });

    // 새로고침/뒤로가기 시 시트가 다시 열리지 않도록 쿼리 제거
    window.history.replaceState(null, '', '/inner/cashbook/history');
    // handleAdd는 매 렌더 새로 생성되어 deps에서 제외(일회성 가드로 충분)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categories]);

  const handleEntryClick = (entry: CashbookEntry) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          coupleId={coupleId}
          editingEntry={entry}
          createdBy={uid}
          onSubmit={(data) => {
            updateMutation.mutate({
              entryId: entry.id,
              data: {
                type: data.type,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
              },
            });
          }}
          onDelete={() => deleteMutation.mutate(entry.id)}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
      <AiParseInput
        categories={(categories ?? []).map((c) => c.name)}
        parseFn={parseEntriesFromText}
        onParsed={(results) => {
          const initialEntries = results.map((r) => ({
            type: r.type as CashbookEntryType,
            amount: r.amount,
            category: r.category,
            description: r.description,
            date: r.date,
            confidence: r.confidence,
          }));
          overlay.open(({ isOpen, close, unmount }) => (
            <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
              <AiBulkPreviewSheet
                initialEntries={initialEntries}
                categories={categories ?? []}
                coupleId={coupleId}
                createdBy={uid}
                onConfirm={(confirmed) => addManyMutation.mutate(confirmed)}
                onClose={() => {
                  close();
                  setTimeout(unmount, 300);
                }}
              />
            </Sheet>
          ));
        }}
      />

      <div className="mt-4">
        <CashbookFilterBar
          period={filter.period}
          periodLabel={range.label}
          activeCount={activeFilterCount}
          canGoNext={canGoNext}
          sort={filter.sort}
          onSortChange={(sort) => setFilter((f) => ({ ...f, sort }))}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onOpen={openFilterSheet}
        />
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          <Skeleton className="h-[108px] rounded-xl" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <MonthlySummary
              income={summary.income}
              expense={summary.expense}
              balance={summary.balance}
            />
            {isFilterActive && (
              <div
                data-testid="filter-result-summary"
                className="mt-1.5 flex items-center justify-between rounded-md bg-muted/60 px-3 py-1.5 text-xs"
              >
                <span className="text-muted-foreground">필터 결과 {filteredEntries.length}건</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {filterSummary.income > 0 && (
                    <span className="text-income">
                      {formatAmount(filterSummary.income, 'income')}
                    </span>
                  )}
                  {filterSummary.expense > 0 && (
                    <span className="text-expense">
                      {formatAmount(filterSummary.expense, 'expense')}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {!isFilterActive && isSingleMonthPeriod && (entries ?? []).length > 0 && (
            <div className="mt-4">
              <AiSpendingAnalysis
                params={{
                  entries: (entries ?? []).map((e) => ({
                    type: e.type,
                    amount: e.amount,
                    category: e.category,
                    date: dayjs(e.date.toDate()).format('YYYY-MM-DD'),
                    description: e.description,
                  })),
                  year: dayjs(range.start).year(),
                  month: dayjs(range.start).month() + 1,
                }}
                analyzeFn={analyzeSpending}
              />
            </div>
          )}

          <div className="mt-6">
            {groups.length > 0 ? (
              <EntryList
                groups={groups}
                categories={categories ?? []}
                onEntryClick={handleEntryClick}
                showDateHeaders={isDateSort(filter.sort)}
              />
            ) : isFilterActive ? (
              <EmptyState
                icon={<BookOpen size={48} className="text-muted-foreground" />}
                title="조건에 맞는 내역이 없어요"
                description="다른 필터를 시도해보세요"
                action={
                  <Button variant="outline" onClick={handleAllFiltersReset}>
                    필터 초기화
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<BookOpen size={48} className="text-muted-foreground" />}
                title="아직 내역이 없어요"
                description="가계부를 시작해보세요"
                action={<Button onClick={() => handleAdd()}>추가하기</Button>}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
