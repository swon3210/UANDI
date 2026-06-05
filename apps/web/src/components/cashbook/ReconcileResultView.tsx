'use client';

import { useState } from 'react';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { ClipboardCheck, AlertCircle, Check } from 'lucide-react';
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';
import { GROUP_LABELS } from '@uandi/cashbook-core';
import type { CashbookCategory, CashbookEntryType } from '@/types';
import { formatAmount } from '@/utils/currency';
import { EntryForm } from './EntryForm';
import { ParsedEntryCard, type ParsedEntryCardData } from './ParsedEntryCard';
import type { ConfirmedEntry } from './AiBulkPreviewSheet';

/** 영수증/스크린샷에서 파싱한 항목 + 가계부 대조 결과 */
export type ReconcileEntry = {
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  confidence: number;
  /** 가계부에 동일 금액·날짜 내역이 이미 존재하면 true */
  matched: boolean;
  /** 매칭된 기존 내역의 날짜 (표시용) */
  matchedDate?: string | null;
};

type ReconcileResultViewProps = {
  entries: ReconcileEntry[];
  categories: CashbookCategory[];
  coupleId: string | null;
  createdBy: string;
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

function MatchedRow({ entry }: { entry: ReconcileEntry }) {
  return (
    <div
      data-testid="reconcile-matched-card"
      className="flex items-center gap-3 rounded-xl border border-income/30 bg-income/5 p-3"
    >
      <Check size={16} className="shrink-0 text-income" aria-label="이미 기록됨" />
      <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
        {GROUP_LABELS[entry.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.category}</p>
        <p className="truncate text-xs text-muted-foreground">
          {entry.description || '메모 없음'} · {entry.date}
        </p>
      </div>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          entry.type === 'income' ? 'text-income' : 'text-expense'
        }`}
      >
        {formatAmount(entry.amount, entry.type)}
      </span>
    </div>
  );
}

/**
 * 영수증 대조 결과 화면 (프레젠테이션).
 * 가계부에 없는 항목(누락)은 토글·편집 후 추가할 수 있고,
 * 이미 기록된 항목은 읽기 전용으로 보여준다.
 * react-query 훅에 의존하지 않으므로 Storybook에서 독립적으로 렌더된다.
 */
export function ReconcileResultView({
  entries,
  categories,
  coupleId,
  createdBy,
  onConfirm,
  onClose,
}: ReconcileResultViewProps) {
  const matched = entries.filter((e) => e.matched);
  const [missing, setMissing] = useState<ParsedEntryCardData[]>(() =>
    entries
      .filter((e) => !e.matched)
      .map((e) => ({
        type: e.type,
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: e.date,
        confidence: e.confidence,
        duplicate: null,
        selected: true,
      }))
  );

  const total = entries.length;
  const missingCount = missing.length;
  const selectedCount = missing.filter((e) => e.selected).length;

  const handleToggle = (index: number, next: boolean) => {
    setMissing((prev) => prev.map((e, i) => (i === index ? { ...e, selected: next } : e)));
  };

  const handleEdit = (index: number) => {
    const target = missing[index];
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
            setMissing((prev) =>
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
    const confirmed = missing
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
      data-testid="reconcile-result"
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-primary" />
          영수증 대조 결과
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4">
        {missingCount > 0 ? (
          <div
            data-testid="reconcile-summary"
            className="mb-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-foreground"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-primary" />
            <span>
              영수증 {total}건 중 <b>{missingCount}건</b>이 가계부에 없어요. 추가할 항목을 확인하고
              버튼을 눌러주세요.
            </span>
          </div>
        ) : (
          <div
            data-testid="reconcile-summary"
            className="mb-3 flex items-start gap-2 rounded-lg border border-income/30 bg-income/5 p-3 text-xs text-foreground"
          >
            <Check size={14} className="mt-0.5 shrink-0 text-income" />
            <span>영수증의 {total}건이 모두 가계부에 기록되어 있어요.</span>
          </div>
        )}

        {missingCount > 0 && (
          <section className="mb-4">
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
              누락 의심 {missingCount}건
            </h3>
            <div className="space-y-2">
              {missing.map((entry, index) => (
                <ParsedEntryCard
                  key={index}
                  entry={entry}
                  onClick={() => handleEdit(index)}
                  onToggleSelected={(next) => handleToggle(index, next)}
                />
              ))}
            </div>
          </section>
        )}

        {matched.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
              이미 기록됨 {matched.length}건
            </h3>
            <div className="space-y-2">
              {matched.map((entry, index) => (
                <MatchedRow key={index} entry={entry} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex gap-2 border-t border-border pt-3">
        {missingCount > 0 ? (
          <>
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              취소
            </Button>
            <Button
              type="button"
              data-testid="reconcile-confirm"
              className="flex-1"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
            >
              {selectedCount}건 추가
            </Button>
          </>
        ) : (
          <Button
            type="button"
            data-testid="reconcile-close"
            className="flex-1"
            onClick={onClose}
          >
            확인
          </Button>
        )}
      </div>
    </SheetContent>
  );
}
