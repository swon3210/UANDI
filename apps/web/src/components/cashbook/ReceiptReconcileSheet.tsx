'use client';

import { useMemo, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType } from '@/types';
import { useDuplicateScopeEntries } from '@/hooks/useCashbook';
import { findDuplicate } from '@/utils/cashbook-duplicate';
import { AiParseInput } from './AiParseInput';
import { ReconcileResultView, type ReconcileEntry } from './ReconcileResultView';
import type { ConfirmedEntry } from './AiBulkPreviewSheet';

/** 파싱 결과(대조 전) — ReconcileEntry에서 매칭 정보를 뺀 형태 */
type ParsedReceiptEntry = Omit<ReconcileEntry, 'matched' | 'matchedDate'>;

type ParseFn = (
  text: string,
  categories: string[],
  images?: string[]
) => Promise<
  {
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    confidence: number;
  }[]
>;

type ReceiptReconcileSheetProps = {
  categories: CashbookCategory[];
  coupleId: string | null;
  createdBy: string;
  parseFn: ParseFn;
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

/**
 * 결산 페이지의 "영수증으로 내역 점검" 진입점.
 * 1단계: 영수증·스크린샷을 올려 AI 파싱
 * 2단계: 그 달 가계부와 대조해 누락(추가 제안)·기록됨을 보여준다
 */
export function ReceiptReconcileSheet({
  categories,
  coupleId,
  createdBy,
  parseFn,
  onConfirm,
  onClose,
}: ReceiptReconcileSheetProps) {
  const [parsed, setParsed] = useState<ParsedReceiptEntry[] | null>(null);

  if (parsed) {
    return (
      <ReconcileResultContainer
        parsed={parsed}
        categories={categories}
        coupleId={coupleId}
        createdBy={createdBy}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
  }

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="receipt-reconcile-sheet"
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <ScanLine size={16} className="text-primary" />
          영수증으로 내역 점검
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4">
        <p className="mb-3 text-xs text-muted-foreground">
          영수증 사진이나 카드·계좌 거래내역 스크린샷을 올리면, 이번 달 가계부에 빠진 내역을 찾아
          추가할 수 있어요.
        </p>
        <AiParseInput
          categories={categories.map((c) => c.name)}
          parseFn={parseFn}
          onParsed={(results) =>
            setParsed(
              results.map((r) => ({
                type: r.type as CashbookEntryType,
                amount: r.amount,
                category: r.category,
                description: r.description,
                date: r.date,
                confidence: r.confidence,
              }))
            )
          }
        />
      </div>
    </SheetContent>
  );
}

type ReconcileResultContainerProps = {
  parsed: ParsedReceiptEntry[];
  categories: CashbookCategory[];
  coupleId: string | null;
  createdBy: string;
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

/** 파싱 결과를 기존 내역과 대조(findDuplicate)해 ReconcileResultView로 넘긴다. */
function ReconcileResultContainer({
  parsed,
  categories,
  coupleId,
  createdBy,
  onConfirm,
  onClose,
}: ReconcileResultContainerProps) {
  const parsedDates = useMemo(() => parsed.map((e) => e.date), [parsed]);
  const existing = useDuplicateScopeEntries(coupleId, parsedDates);

  const reconciled = useMemo<ReconcileEntry[]>(
    () =>
      parsed.map((e) => {
        const match = findDuplicate({ amount: e.amount, date: e.date }, existing);
        return { ...e, matched: !!match, matchedDate: match?.existingDate ?? null };
      }),
    [parsed, existing]
  );

  // existing이 비동기로 채워지므로, 매칭 결과가 도착하면 View를 새 초기 상태로 리마운트한다.
  const viewKey = reconciled.map((e) => (e.matched ? '1' : '0')).join('-');

  return (
    <ReconcileResultView
      key={viewKey}
      entries={reconciled}
      categories={categories}
      coupleId={coupleId}
      createdBy={createdBy}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
