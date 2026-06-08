'use client';

import { Check, X, Pencil } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatAmount } from '@/utils/currency';
import { formatDay } from '@/utils/date';
import type { CashbookEntryType, PredictionSource } from '@/types';

// 가계부 점선 박스(§4-2 / SYNC-02). firebase 비의존 view 타입으로 받아 Storybook에서 그대로 렌더.
export type PredictionPromptView = {
  id: string;
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  source: PredictionSource;
  date: Date;
  /** 반복 주기 표기(자동감지 등). 없으면 미표시. 예: "매월 25일". */
  recurrenceLabel?: string | null;
};

const SOURCE_LABEL: Record<PredictionSource, string> = {
  calendar: '캘린더',
  auto: '자동감지',
};

type PredictionPromptBoxProps = {
  prompt: PredictionPromptView;
  onConfirm: () => void; // ✓ 추가
  onReject: () => void; // ✗ 아니오
  onEdit: () => void; // ✎ 수정 후 추가
};

/** 오늘 이후 날짜에 뜨는 예측 V/X 프롬프트(점선 박스). */
export function PredictionPromptBox({ prompt, onConfirm, onReject, onEdit }: PredictionPromptBoxProps) {
  return (
    <div
      data-testid="prediction-prompt-box"
      data-source={prompt.source}
      className="space-y-2.5 rounded-xl border border-dashed border-coral-300 bg-coral-50/50 p-3"
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-coral-300 text-xs font-bold text-coral-500"
        >
          ◇
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">
              {prompt.category}
              {prompt.description && (
                <span className="font-normal text-muted-foreground"> · {prompt.description}</span>
              )}
            </p>
            <span
              className={cn(
                'shrink-0 text-sm font-semibold tabular-nums',
                prompt.type === 'income' ? 'text-income' : 'text-expense'
              )}
            >
              {formatAmount(prompt.amount, prompt.type)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {SOURCE_LABEL[prompt.source]} · {formatDay(prompt.date)}
            {prompt.recurrenceLabel ? ` · ${prompt.recurrenceLabel}` : ''}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onConfirm} data-testid="prediction-confirm">
          <Check size={14} className="mr-1" />
          추가
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onEdit}
          data-testid="prediction-edit"
        >
          <Pencil size={14} className="mr-1" />
          수정 후 추가
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onReject}
          data-testid="prediction-reject"
          aria-label="아니오"
        >
          <X size={14} className="mr-1" />
          아니오
        </Button>
      </div>
    </div>
  );
}
