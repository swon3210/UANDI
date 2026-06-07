'use client';

import { X, History } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatAmount } from '@/utils/currency';
import { formatDay } from '@/utils/date';
import type { CashbookEntryType } from '@/types';

export type RetroItemView = {
  id: string;
  type: CashbookEntryType;
  amount: number;
  category: string;
  date: Date;
};

type PredictionRetroBannerProps = {
  items: RetroItemView[];
  onConfirm: (item: RetroItemView) => void; // ✓ 네 (SYNC-03)
  onReject: (item: RetroItemView) => void; // ✗ 아니오 (SYNC-04)
  onDismiss: () => void; // 오늘은 그만 보기
};

/** §SYNC-06: 예측 날짜가 지났는데 미처리된 항목을 다음날 가계부 상단에 회고로 묻는다. */
export function PredictionRetroBanner({
  items,
  onConfirm,
  onReject,
  onDismiss,
}: PredictionRetroBannerProps) {
  if (items.length === 0) return null;

  return (
    <div
      data-testid="prediction-retro-banner"
      role="alert"
      aria-live="polite"
      className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900"
    >
      <div className="flex items-center gap-2">
        <History size={16} className="shrink-0 text-amber-600" aria-hidden />
        <p className="flex-1 text-sm font-semibold">지난 예측, 실제로 일어났나요?</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-0.5 h-7 w-7 shrink-0 text-current hover:bg-amber-100"
          onClick={onDismiss}
          aria-label="회고 알림 닫기"
          data-testid="retro-dismiss"
        >
          <X size={15} />
        </Button>
      </div>

      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            data-testid="retro-item"
            className="flex items-center gap-2 rounded-lg bg-white/60 px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="text-amber-700">{formatDay(item.date)}</span> · {item.category}
              </p>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  item.type === 'income' ? 'text-income' : 'text-expense'
                )}
              >
                {formatAmount(item.amount, item.type)}
              </span>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => onConfirm(item)}
              data-testid="retro-confirm"
            >
              네
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => onReject(item)}
              data-testid="retro-reject"
            >
              아니오
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
