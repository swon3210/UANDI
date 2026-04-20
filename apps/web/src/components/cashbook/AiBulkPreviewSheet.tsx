'use client';

import { useState } from 'react';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { Sparkles, Inbox } from 'lucide-react';
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  EmptyState,
} from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType } from '@/types';
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

type AiBulkPreviewSheetProps = {
  initialEntries: ParsedEntryCardData[];
  categories: CashbookCategory[];
  createdBy: string;
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

export function AiBulkPreviewSheet({
  initialEntries,
  categories,
  createdBy,
  onConfirm,
  onClose,
}: AiBulkPreviewSheetProps) {
  const [entries, setEntries] = useState<ParsedEntryCardData[]>(initialEntries);

  const handleRemove = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (index: number) => {
    const target = entries[index];
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories}
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
    const confirmed = entries.map<ConfirmedEntry>((e) => ({
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
        {entries.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={<Inbox size={48} className="text-muted-foreground" />}
              title="추가할 내역이 없어요"
              description="모든 항목을 삭제했어요. 창을 닫고 다시 입력해주세요."
            />
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              항목을 탭하면 상세 편집이 가능하고, ✕로 삭제할 수 있어요.
            </p>
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <ParsedEntryCard
                  key={index}
                  entry={entry}
                  onClick={() => handleEdit(index)}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </div>
          </>
        )}
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
          disabled={entries.length === 0}
        >
          {entries.length}건 추가
        </Button>
      </div>
    </SheetContent>
  );
}
