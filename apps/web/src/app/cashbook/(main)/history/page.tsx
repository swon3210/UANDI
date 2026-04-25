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
  useGroupedEntries,
  useAddEntry,
  useAddEntries,
  useUpdateEntry,
  useDeleteEntry,
} from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { MonthSelector } from '@/components/cashbook/MonthSelector';
import { MonthlySummary } from '@/components/cashbook/MonthlySummary';
import { EntryList } from '@/components/cashbook/EntryList';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { AiParseInput } from '@/components/cashbook/AiParseInput';
import { AiBulkPreviewSheet } from '@/components/cashbook/AiBulkPreviewSheet';
import { AiSpendingAnalysis } from '@/components/cashbook/AiSpendingAnalysis';
import { parseEntriesFromText, analyzeSpending } from '@/services/ai';
import type { CashbookEntry, CashbookEntryType } from '@/types';

export default function CashbookPage() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const year = dayjs(selectedDate).year();
  const month = dayjs(selectedDate).month();

  const { data: entries, isLoading: entriesLoading } = useCashbookEntries(coupleId, year, month);
  const { data: categories, isLoading: categoriesLoading } = useCashbookCategories(coupleId);
  const isLoading = entriesLoading || categoriesLoading;
  const summary = useMonthlySummary(entries);
  const groups = useGroupedEntries(entries);

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
        <MonthSelector selectedDate={selectedDate} onChange={setSelectedDate} />
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
          </div>

          {(entries ?? []).length > 0 && (
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
