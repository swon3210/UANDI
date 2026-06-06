'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { ArrowLeft, BookOpen, Plus } from 'lucide-react';
import { Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookEntries,
  useGroupedEntries,
  useAddEntries,
  useUpdateEntry,
  useDeleteEntry,
} from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  useSettlement,
  useRemoveSettlementAttachment,
  monthKeyOf,
} from '@/hooks/useSettlement';
import { SettlementSummaryHeader } from '@/components/cashbook/SettlementSummaryHeader';
import { SettlementAttachmentGallery } from '@/components/cashbook/SettlementAttachmentGallery';
import { SettlementAddSheet } from '@/components/cashbook/SettlementAddSheet';
import { EntryList } from '@/components/cashbook/EntryList';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { parseEntriesFromText } from '@/services/ai';
import type { CashbookEntry } from '@/types';

function parseMonthParam(value: string | null): Date {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const d = dayjs(`${value}-01`);
    if (d.isValid()) return d.toDate();
  }
  return new Date();
}

export default function SettlementEntriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const monthParam = searchParams.get('month');
  const selectedDate = parseMonthParam(monthParam);
  const year = dayjs(selectedDate).year();
  const month0 = dayjs(selectedDate).month();
  const month1 = month0 + 1;
  const monthKey = monthKeyOf(year, month1);
  const monthLabel = dayjs(selectedDate).format('YYYY년 M월');

  const { data: entries, isLoading: entriesLoading } = useCashbookEntries(coupleId, year, month0);
  const { data: categories, isLoading: categoriesLoading } = useCashbookCategories(coupleId);
  const { data: settlement } = useSettlement(coupleId, monthKey);

  const addManyMutation = useAddEntries(coupleId);
  const updateMutation = useUpdateEntry(coupleId);
  const deleteMutation = useDeleteEntry(coupleId);
  const removeAttachment = useRemoveSettlementAttachment(coupleId);

  const isLoading = entriesLoading || categoriesLoading;
  const groups = useGroupedEntries(entries, 'latest');

  const { income, expense, flex } = useMemo(() => {
    let i = 0;
    let e = 0;
    let f = 0;
    for (const entry of entries ?? []) {
      if (entry.type === 'income') i += entry.amount;
      else if (entry.type === 'expense') e += entry.amount;
      else if (entry.type === 'flex') f += entry.amount;
    }
    return { income: i, expense: e, flex: f };
  }, [entries]);

  const openAdd = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SettlementAddSheet
          categories={categories ?? []}
          coupleId={coupleId}
          createdBy={uid}
          year={year}
          month={month1}
          parseFn={parseEntriesFromText}
          onConfirm={(confirmed) => addManyMutation.mutate(confirmed)}
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
          onSubmit={(data) =>
            updateMutation.mutate({
              entryId: entry.id,
              data: {
                type: data.type,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
              },
            })
          }
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
    <main
      className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20"
      data-testid="settlement-entries-page"
    >
      {/* 헤더: 월 + 결산으로 돌아가기 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="결산으로"
          data-testid="settlement-entries-back"
          onClick={() => router.push(`/inner/cashbook/settlement?month=${monthKey}`)}
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-base font-semibold">{monthLabel} 결산 내역</h1>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          <Skeleton className="h-[72px] rounded-xl" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <SettlementSummaryHeader income={income} expense={expense} flex={flex} />
          </div>

          {/* 내역 추가 (영수증·스크린샷 첨부 권장) */}
          <Button
            data-testid="settlement-add-btn"
            variant="outline"
            className="mt-4 w-full justify-start gap-2"
            onClick={openAdd}
          >
            <Plus size={16} className="text-primary" />
            영수증·스크린샷 첨부하고 내역 추가
          </Button>

          {/* 첨부 갤러리 */}
          <div className="mt-3">
            <SettlementAttachmentGallery
              attachments={settlement?.attachments ?? []}
              onRemove={(att) => removeAttachment.mutate({ monthKey, attachment: att })}
              removingId={
                removeAttachment.isPending ? removeAttachment.variables?.attachment.id : null
              }
            />
          </div>

          {/* 내역 리스트 */}
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
                title="이번 달 내역이 없어요"
                description="영수증·스크린샷을 첨부하거나 직접 내역을 추가해보세요"
                action={
                  <Button size="sm" onClick={openAdd}>
                    <Plus size={16} className="mr-1.5" />
                    내역 추가
                  </Button>
                }
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
