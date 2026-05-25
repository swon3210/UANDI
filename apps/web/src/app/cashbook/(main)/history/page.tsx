'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { BookOpen } from 'lucide-react';
import { Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookEntries,
  useMonthlySummary,
  useFilteredEntries,
  useGroupedEntries,
  useAddEntry,
  useAddEntries,
  useUpdateEntry,
  useDeleteEntry,
  type EntryFilterType,
} from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { MonthSelector } from '@/components/cashbook/MonthSelector';
import { MonthlySummary } from '@/components/cashbook/MonthlySummary';
import { EntryList } from '@/components/cashbook/EntryList';
import { EntryFilter } from '@/components/cashbook/EntryFilter';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { AiParseInput } from '@/components/cashbook/AiParseInput';
import { AiBulkPreviewSheet } from '@/components/cashbook/AiBulkPreviewSheet';
import { AiSpendingAnalysis } from '@/components/cashbook/AiSpendingAnalysis';
import { formatAmount } from '@/utils/currency';
import { parseEntriesFromText, analyzeSpending } from '@/services/ai';
import type { CashbookEntry, CashbookEntryType } from '@/types';

export default function CashbookPage() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const year = dayjs(selectedDate).year();
  const month = dayjs(selectedDate).month();

  const [typeFilter, setTypeFilter] = useState<EntryFilterType>('all');
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const isFilterActive = typeFilter !== 'all' || selectedCategoryNames.length > 0;

  const { data: entries, isLoading: entriesLoading } = useCashbookEntries(coupleId, year, month);
  const { data: categories, isLoading: categoriesLoading } = useCashbookCategories(coupleId);
  const isLoading = entriesLoading || categoriesLoading;
  const summary = useMonthlySummary(entries);
  const filteredEntries = useFilteredEntries(entries, typeFilter, selectedCategoryNames);
  const filterSummary = useMonthlySummary(filteredEntries);
  const groups = useGroupedEntries(filteredEntries);

  const handleMonthChange = (next: Date) => {
    setSelectedDate(next);
    setSelectedCategoryNames([]);
  };

  const handleTypeChange = (next: EntryFilterType) => {
    setTypeFilter(next);
    setSelectedCategoryNames([]);
  };

  const handleCategoryToggle = (name: string) => {
    setSelectedCategoryNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleFilterReset = () => {
    setSelectedCategoryNames([]);
  };

  const handleAllFiltersReset = () => {
    setTypeFilter('all');
    setSelectedCategoryNames([]);
  };

  const addMutation = useAddEntry(coupleId);
  const addManyMutation = useAddEntries(coupleId);
  const updateMutation = useUpdateEntry(coupleId);
  const deleteMutation = useDeleteEntry(coupleId);
  const { notifyTransition } = useBudgetAlerts(coupleId, year, month + 1);

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
          onSubmit={(data) =>
            addMutation.mutate(data, { onSuccess: () => notifyTransition(data) })
          }
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

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
        <MonthSelector selectedDate={selectedDate} onChange={handleMonthChange} />
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

          {(categories ?? []).length > 0 && (
            <div className="mt-4">
              <EntryFilter
                categories={categories ?? []}
                typeFilter={typeFilter}
                selectedCategoryNames={selectedCategoryNames}
                onTypeChange={handleTypeChange}
                onCategoryToggle={handleCategoryToggle}
                onReset={handleFilterReset}
              />
            </div>
          )}

          {!isFilterActive && (entries ?? []).length > 0 && (
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
                  year,
                  month: month + 1,
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
                action={
                  <Button onClick={() => handleAdd()}>추가하기</Button>
                }
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
