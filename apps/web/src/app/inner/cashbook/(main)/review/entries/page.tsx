'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
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
  useAddSettlementAttachment,
  useRemoveSettlementAttachment,
  monthKeyOf,
} from '@/hooks/useSettlement';
import { SettlementSummaryHeader } from '@/components/cashbook/SettlementSummaryHeader';
import { SettlementAttachmentGallery } from '@/components/cashbook/SettlementAttachmentGallery';
import { SettlementBulkSyncSheet } from '@/components/cashbook/SettlementBulkSyncSheet';
import { EntryList } from '@/components/cashbook/EntryList';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { compressImage } from '@/utils/image-compress';
import type { CashbookEntry, SettlementImageKind } from '@/types';

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
  const addAttachment = useAddSettlementAttachment(coupleId);
  const removeAttachment = useRemoveSettlementAttachment(coupleId);

  const [attachingKind, setAttachingKind] = useState<SettlementImageKind | null>(null);

  const isLoading = entriesLoading || categoriesLoading;
  const groups = useGroupedEntries(entries, 'latest');
  const attachments = settlement?.attachments ?? [];

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

  // 첨부 전용: 파일 선택 → 압축 → Storage 업로드 (파싱은 "전체 분석 & 동기화"에서만)
  const handleAttach = async (kind: SettlementImageKind, files: File[]) => {
    if (!coupleId) return;
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast.error(`이미지는 최대 ${MAX_ATTACHMENTS}장까지 첨부할 수 있어요`);
      return;
    }
    const sized = files.filter((f) => f.size <= MAX_FILE_SIZE);
    if (sized.length < files.length) {
      toast.error('10MB를 초과하는 파일은 제외했어요');
    }
    const accepted = sized.slice(0, remaining);
    if (sized.length > remaining) {
      toast.warning(`최대 ${MAX_ATTACHMENTS}장까지만 첨부돼요. 앞 ${remaining}장만 추가했어요`);
    }
    if (accepted.length === 0) return;

    setAttachingKind(kind);
    try {
      for (const file of accepted) {
        const compressed = await compressImage(file);
        await addAttachment.mutateAsync({ year, month: month1, file: compressed, kind });
      }
    } catch {
      // 개별 실패 토스트는 훅에서 처리
    } finally {
      setAttachingKind(null);
    }
  };

  const openBulkSync = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SettlementBulkSyncSheet
          coupleId={coupleId}
          createdBy={uid}
          monthKey={monthKey}
          attachments={attachments}
          categories={categories ?? []}
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
      {/* 헤더: 월 + 점검으로 돌아가기 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="점검으로"
          data-testid="settlement-entries-back"
          onClick={() => router.push(`/inner/cashbook/review?month=${monthKey}`)}
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-base font-semibold">{monthLabel} 점검 내역</h1>
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

          {/* 첨부 갤러리 — 계좌/카드 목록별 "이미지 추가"(첨부 전용) */}
          <div className="mt-4">
            <SettlementAttachmentGallery
              attachments={attachments}
              onAttach={handleAttach}
              attachingKind={attachingKind}
              onRemove={(att) => removeAttachment.mutate({ monthKey, attachment: att })}
              removingId={
                removeAttachment.isPending ? removeAttachment.variables?.attachment.id : null
              }
            />
          </div>

          {/* 전체 분석 & 동기화 — 첨부한 이미지 전체를 한 번에 분석해 누락 내역 추가 */}
          <Button
            className="mt-3 w-full"
            data-testid="settlement-analyze-all"
            disabled={attachments.length === 0 || attachingKind !== null}
            onClick={openBulkSync}
          >
            <Sparkles size={16} className="mr-1.5" />
            전체 분석 &amp; 동기화 ({attachments.length})
          </Button>

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
                description="위에서 계좌·카드 캡처를 첨부하고 '전체 분석 & 동기화'를 눌러 누락 내역을 채워보세요"
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
