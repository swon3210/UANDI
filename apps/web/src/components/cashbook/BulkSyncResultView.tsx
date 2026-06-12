'use client';

import { useMemo, useState } from 'react';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { Sparkles, ArrowLeftRight, CalendarClock, AlertCircle } from 'lucide-react';
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import { EntryForm } from './EntryForm';
import { ParsedEntryCard, type ParsedEntryCardData } from './ParsedEntryCard';
import type { ConfirmedEntry } from './AiBulkPreviewSheet';

/** 일괄 분석 결과 1건 — 카드 표시 데이터 + 거래 월 + 송금 여부 */
export type BulkSyncEntryData = ParsedEntryCardData & {
  month: string; // YYYY-MM (entry.date 기준)
  isTransfer: boolean;
};

export type BulkSyncResultViewProps = {
  initialEntries: BulkSyncEntryData[];
  /** 현재 결산월 (YYYY-MM) — 이 달 항목은 기본 ON, 다른 달은 기본 OFF */
  selectedMonth: string;
  /** 분석한 이미지 장수 (요약 배너용) */
  imageCount: number;
  /** 분류(계좌/카드)와 다른 종류로 판단된 이미지 수 (경고 배너용) */
  mismatchCount?: number;
  categories: CashbookCategory[];
  coupleId: string | null;
  createdBy: string;
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

function monthLabel(month: string): string {
  const d = dayjs(`${month}-01`);
  return d.isValid() ? d.format('YYYY년 M월') : month;
}

export function BulkSyncResultView({
  initialEntries,
  selectedMonth,
  imageCount,
  mismatchCount = 0,
  categories,
  coupleId,
  createdBy,
  onConfirm,
  onClose,
}: BulkSyncResultViewProps) {
  const [entries, setEntries] = useState<BulkSyncEntryData[]>(initialEntries);

  // 송금(확인 필요) / 월별(나머지) 분리. 월은 오름차순, 선택 결산월을 맨 앞으로.
  const { transferRows, monthGroups } = useMemo(() => {
    const indexed = entries.map((entry, index) => ({ entry, index }));
    const transfers = indexed.filter(({ entry }) => entry.isTransfer);
    const normals = indexed.filter(({ entry }) => !entry.isTransfer);

    const byMonth = new Map<string, { entry: BulkSyncEntryData; index: number }[]>();
    for (const item of normals) {
      const list = byMonth.get(item.entry.month) ?? [];
      list.push(item);
      byMonth.set(item.entry.month, list);
    }
    const groups = [...byMonth.entries()]
      .sort((a, b) => {
        if (a[0] === selectedMonth) return -1;
        if (b[0] === selectedMonth) return 1;
        return a[0] < b[0] ? -1 : 1;
      })
      .map(([month, rows]) => ({ month, rows, isSelectedMonth: month === selectedMonth }));

    return { transferRows: transfers, monthGroups: groups };
  }, [entries, selectedMonth]);

  const selectedCount = entries.filter((e) => e.selected).length;
  const missingCount = entries.filter((e) => !e.duplicate && !e.isTransfer).length;
  const transferCount = transferRows.length;
  const duplicateCount = entries.filter((e) => e.duplicate).length;

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
            const nextDate = dayjs(data.date.toDate()).format('YYYY-MM-DD');
            setEntries((prev) =>
              prev.map((e, i) =>
                i === index
                  ? {
                      ...e,
                      type: data.type,
                      amount: data.amount,
                      category: data.category,
                      description: data.description,
                      date: nextDate,
                      month: nextDate.slice(0, 7),
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
      data-testid="bulk-sync-result"
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          첨부 내역 일괄 분석
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        <p
          data-testid="bulk-sync-summary"
          className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground"
        >
          이미지 {imageCount}장에서 누락 의심 <b className="text-foreground">{missingCount}건</b>을
          찾았어요
          {duplicateCount > 0 && ` · 이미 기록 ${duplicateCount}건은 제외`}
          {transferCount > 0 && ` · 송금 ${transferCount}건은 확인 필요`}.
        </p>

        {mismatchCount > 0 && (
          <div
            data-testid="bulk-sync-mismatch-banner"
            className="flex items-start gap-2 rounded-lg border border-amber-400/50 bg-amber-50/50 p-3 text-xs text-amber-700 dark:bg-amber-500/5 dark:text-amber-400"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              일부 이미지({mismatchCount}장)가 선택한 분류(계좌/카드)와 다른 종류 같아요. 결과를
              확인해 주세요.
            </span>
          </div>
        )}

        {monthGroups.map(({ month, rows, isSelectedMonth }) => (
          <div key={month} data-testid={`bulk-sync-month-${month}`}>
            <div className="mb-1.5 flex items-center gap-2">
              <p className="text-xs font-semibold">{monthLabel(month)}</p>
              {!isSelectedMonth && (
                <span
                  data-testid={`bulk-sync-other-month-${month}`}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                >
                  <CalendarClock size={10} />이 달이 아니에요
                </span>
              )}
            </div>
            <div className="space-y-2">
              {rows.map(({ entry, index }) => (
                <ParsedEntryCard
                  key={index}
                  entry={entry}
                  onClick={() => handleEdit(index)}
                  onToggleSelected={(next) => handleToggle(index, next)}
                />
              ))}
            </div>
          </div>
        ))}

        {transferRows.length > 0 && (
          <div data-testid="bulk-sync-transfer-section">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ArrowLeftRight size={13} />
              확인 필요 · 송금 ({transferCount})
            </div>
            <p className="mb-2 text-[11px] text-muted-foreground">
              단순 송금·이체로 보이는 항목이에요. 가계부에 넣을 항목만 켜주세요.
            </p>
            <div className="space-y-2">
              {transferRows.map(({ entry, index }) => (
                <ParsedEntryCard
                  key={index}
                  entry={entry}
                  onClick={() => handleEdit(index)}
                  onToggleSelected={(next) => handleToggle(index, next)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          data-testid="bulk-sync-cancel"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          type="button"
          data-testid="bulk-sync-confirm"
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
