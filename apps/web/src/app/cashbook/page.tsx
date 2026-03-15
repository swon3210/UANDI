'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Plus, Settings } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import {
  Header,
  Button,
  Sheet,
  EmptyState,
  FullScreenSpinner,
} from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookEntries,
  useMonthlySummary,
  useGroupedEntries,
  useAddEntry,
  useUpdateEntry,
  useDeleteEntry,
} from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { MonthSelector } from '@/components/cashbook/MonthSelector';
import { MonthlySummary } from '@/components/cashbook/MonthlySummary';
import { EntryList } from '@/components/cashbook/EntryList';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { BottomNav } from '@/components/BottomNav';
import type { CashbookEntry } from '@/types';

export default function CashbookPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const year = dayjs(selectedDate).year();
  const month = dayjs(selectedDate).month();

  const { data: entries, isPending: entriesPending } = useCashbookEntries(coupleId, year, month);
  const { data: categories, isPending: categoriesPending } = useCashbookCategories(coupleId);
  const isLoading = entriesPending || categoriesPending;
  const summary = useMonthlySummary(entries);
  const groups = useGroupedEntries(entries);

  const addMutation = useAddEntry(coupleId);
  const updateMutation = useUpdateEntry(coupleId);
  const deleteMutation = useDeleteEntry(coupleId);

  const handleAdd = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          createdBy={uid}
          onSubmit={(data) => addMutation.mutate(data)}
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

  if (isLoading) return <FullScreenSpinner />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="cashbook-header"
        title="가계부"
        rightSlot={
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push('/cashbook/categories')}
              aria-label="카테고리 설정"
            >
              <Settings size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleAdd}
              aria-label="추가"
              data-testid="add-entry-button"
            >
              <Plus size={20} />
            </Button>
          </div>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <MonthSelector selectedDate={selectedDate} onChange={setSelectedDate} />

        <div className="mt-4">
          <MonthlySummary
            income={summary.income}
            expense={summary.expense}
            balance={summary.balance}
          />
        </div>

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
                <Button onClick={handleAdd}>추가하기</Button>
              }
            />
          )}
        </div>
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}
