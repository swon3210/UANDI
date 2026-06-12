'use client';

import { useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button, SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType, SettlementAttachment } from '@/types';
import { useAnalyzeAttachments } from '@/hooks/useSettlement';
import { useDuplicateScopeEntries } from '@/hooks/useCashbook';
import { findDuplicate } from '@/utils/cashbook-duplicate';
import { BulkSyncResultView, type BulkSyncEntryData } from './BulkSyncResultView';
import type { ConfirmedEntry } from './AiBulkPreviewSheet';

type SettlementBulkSyncSheetProps = {
  coupleId: string | null;
  createdBy: string;
  /** 현재 결산월 (YYYY-MM) */
  monthKey: string;
  attachments: SettlementAttachment[];
  categories: CashbookCategory[];
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

/**
 * 첨부 이미지 전체를 한 번에 분석해 누락 내역을 일괄 동기화하는 컨테이너.
 * 1) useAnalyzeAttachments로 전체 분석(자동 1회)
 * 2) 결과 entry를 모아 그 달 ±범위의 기존 내역과 중복 검사(findDuplicate)
 * 3) 거래 월 단위로 그룹핑 + 송금 분리해 BulkSyncResultView 렌더
 */
export function SettlementBulkSyncSheet({
  coupleId,
  createdBy,
  monthKey,
  attachments,
  categories,
  onConfirm,
  onClose,
}: SettlementBulkSyncSheetProps) {
  const analyze = useAnalyzeAttachments(
    coupleId,
    monthKey,
    attachments,
    useMemo(() => categories.map((c) => c.name), [categories])
  );

  // 분석된 모든 entry를 평탄화 (이미지↔월 귀속은 entry.date로 결정).
  const flatEntries = useMemo(() => {
    if (!analyze.data) return [];
    return analyze.data.flatMap((r) =>
      r.entries.map((e) => ({
        type: e.type as CashbookEntryType,
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: e.date,
        confidence: e.confidence,
        isTransfer: e.isTransfer ?? false,
        month: e.date.slice(0, 7),
      }))
    );
  }, [analyze.data]);

  const mismatchCount = useMemo(
    () => (analyze.data ?? []).filter((r) => r.imageKindMismatch).length,
    [analyze.data]
  );

  const parsedDates = useMemo(() => flatEntries.map((e) => e.date), [flatEntries]);
  const existing = useDuplicateScopeEntries(coupleId, parsedDates);

  const annotated = useMemo<BulkSyncEntryData[]>(() => {
    return flatEntries.map((e) => {
      const duplicate = findDuplicate({ amount: e.amount, date: e.date }, existing);
      // 선택 결산월 + 비중복 + 비송금만 기본 ON
      const selected = !duplicate && !e.isTransfer && e.month === monthKey;
      return { ...e, duplicate, selected };
    });
  }, [flatEntries, existing, monthKey]);

  // 중복 결과가 비동기로 도착하면 View를 새 초기 상태로 리마운트.
  const bodyKey = annotated
    .map((e) => `${e.month}:${e.duplicate ? '1' : '0'}:${e.isTransfer ? 't' : 'n'}`)
    .join('|');

  if (analyze.isLoading) {
    return (
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] max-h-[90vh] flex flex-col"
        data-testid="bulk-sync-loading"
      >
        <SheetHeader>
          <SheetTitle>첨부 내역 일괄 분석</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm">첨부한 이미지 {attachments.length}장을 분석하고 있어요…</p>
        </div>
      </SheetContent>
    );
  }

  if (analyze.isError) {
    return (
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] max-h-[90vh] flex flex-col"
        data-testid="bulk-sync-error"
      >
        <SheetHeader>
          <SheetTitle>첨부 내역 일괄 분석</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle size={28} className="text-destructive" />
          <p className="text-sm text-muted-foreground">
            이미지 분석에 실패했어요. 잠시 후 다시 시도해주세요.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
            <Button onClick={() => analyze.refetch()}>다시 시도</Button>
          </div>
        </div>
      </SheetContent>
    );
  }

  return (
    <BulkSyncResultView
      key={bodyKey}
      initialEntries={annotated}
      selectedMonth={monthKey}
      imageCount={attachments.length}
      mismatchCount={mismatchCount}
      categories={categories}
      coupleId={coupleId}
      createdBy={createdBy}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
