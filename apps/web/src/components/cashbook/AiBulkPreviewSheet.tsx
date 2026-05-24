'use client';

import { useMemo, useState } from 'react';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { Sparkles, AlertCircle } from 'lucide-react';
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType } from '@/types';
import { useDuplicateScopeEntries } from '@/hooks/useCashbook';
import { findDuplicate } from '@/utils/cashbook-duplicate';
import { EntryForm } from './EntryForm';
import { ParsedEntryCard, type ParsedEntryCardData } from './ParsedEntryCard';

export type ConfirmedEntry = {
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: Timestamp;
  createdBy: string;
};

/** 외부에서 받는 entry 타입 (selected/duplicate는 내부에서 계산) */
export type InitialParsedEntry = Omit<ParsedEntryCardData, 'selected' | 'duplicate'>;

type AiBulkPreviewSheetProps = {
  initialEntries: InitialParsedEntry[];
  categories: CashbookCategory[];
  coupleId: string | null;
  createdBy: string;
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

export function AiBulkPreviewSheet(props: AiBulkPreviewSheetProps) {
  const parsedDates = useMemo(
    () => props.initialEntries.map((e) => e.date),
    [props.initialEntries]
  );
  const existing = useDuplicateScopeEntries(props.coupleId, parsedDates);

  const annotated = useMemo<ParsedEntryCardData[]>(
    () =>
      props.initialEntries.map((e) => {
        const duplicate = findDuplicate({ amount: e.amount, date: e.date }, existing);
        return { ...e, duplicate, selected: !duplicate };
      }),
    [props.initialEntries, existing]
  );

  // existing이 비동기로 채워지므로, annotated의 길이를 key로 사용해
  // duplicate 결과가 도착했을 때 Body가 새로운 초기 상태로 리마운트되게 한다.
  const bodyKey = annotated.map((e) => (e.duplicate ? '1' : '0')).join('-');

  return (
    <AiBulkPreviewSheetBody
      key={bodyKey}
      initialAnnotatedEntries={annotated}
      categories={props.categories}
      coupleId={props.coupleId}
      createdBy={props.createdBy}
      onConfirm={props.onConfirm}
      onClose={props.onClose}
    />
  );
}

type AiBulkPreviewSheetBodyProps = {
  initialAnnotatedEntries: ParsedEntryCardData[];
  categories: CashbookCategory[];
  coupleId: string | null;
  createdBy: string;
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

function AiBulkPreviewSheetBody({
  initialAnnotatedEntries,
  categories,
  coupleId,
  createdBy,
  onConfirm,
  onClose,
}: AiBulkPreviewSheetBodyProps) {
  const [entries, setEntries] = useState<ParsedEntryCardData[]>(initialAnnotatedEntries);

  const duplicateCount = entries.filter((e) => e.duplicate).length;
  const selectedCount = entries.filter((e) => e.selected).length;

  const handleToggle = (index: number, next: boolean) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, selected: next } : e)));
  };

  const handleEdit = (index: number) => {
    const target = entries[index];
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories}
          coupleId={coupleId}
          createdBy={createdBy}
          prefill={{
            type: target.type,
            amount: target.amount,
            category: target.category,
            description: target.description,
            date: target.date,
          }}
          onSubmit={(data) => {
            setEntries((prev) =>
              prev.map((e, i) =>
                i === index
                  ? {
                      type: data.type,
                      amount: data.amount,
                      category: data.category,
                      description: data.description,
                      date: dayjs(data.date.toDate()).format('YYYY-MM-DD'),
                      confidence: 1,
                      duplicate: null,
                      selected: true,
                    }
                  : e
              )
            );
          }}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleConfirm = () => {
    const confirmed = entries
      .filter((e) => e.selected)
      .map<ConfirmedEntry>((e) => ({
        type: e.type,
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: Timestamp.fromDate(dayjs(e.date).toDate()),
        createdBy,
      }));
    onConfirm(confirmed);
    onClose();
  };

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="ai-bulk-preview-sheet"
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          AI 파싱 결과 확인
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4">
        {duplicateCount > 0 && (
          <div
            data-testid="ai-bulk-duplicate-banner"
            className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              기존 내역과 중복으로 보이는 {duplicateCount}건은 추가에서 제외했어요. 필요하면 우측
              스위치를 켜서 추가할 수 있어요.
            </span>
          </div>
        )}
        <p className="mb-3 text-xs text-muted-foreground">
          항목을 탭하면 상세 편집이 가능하고, 우측 스위치로 추가 여부를 정할 수 있어요.
        </p>
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <ParsedEntryCard
              key={index}
              entry={entry}
              onClick={() => handleEdit(index)}
              onToggleSelected={(next) => handleToggle(index, next)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          type="button"
          data-testid="ai-bulk-confirm"
          className="flex-1"
          onClick={handleConfirm}
          disabled={selectedCount === 0}
        >
          {selectedCount}건 추가
        </Button>
      </div>
    </SheetContent>
  );
}
