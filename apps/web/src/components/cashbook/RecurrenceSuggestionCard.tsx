'use client';

import { Sparkle, Check, X, CalendarX } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';

// 정기 발생 등록/해제 제안 카드(Phase 6·7). firebase 비의존 view 타입으로 Storybook에서 그대로 렌더.
export type RecurrenceSuggestionView = {
  categoryId: string;
  categoryName: string;
  type: 'income' | 'expense';
  /** 'add': 미선언 반복 항목을 정기 발생으로 등록 제안. 'remove': 발생이 끊긴 정기 발생 해제 제안. */
  kind: 'add' | 'remove';
  /** 'add'일 때 등록에 사용할 발생일(1~31). 'remove'는 표시에 안 쓰임. */
  dayOfMonth: number;
  /** 예상/감지 금액. 0이면 미표시. */
  amount: number;
  /** 사람이 읽는 발생 주기 표기. add: "매월 15일쯤", remove: "매월 25일"(formatRecurrence). */
  scheduleLabel: string;
};

type RecurrenceSuggestionCardProps = {
  suggestion: RecurrenceSuggestionView;
  onAccept: () => void;
  onDismiss: () => void;
};

/** 정기 지출/정기 수입 명칭(타입별). */
function kindNoun(type: 'income' | 'expense'): string {
  return type === 'income' ? '정기 수입' : '정기 지출';
}

/**
 * 정기 발생 등록/해제 제안.
 * - add: 과거 반복이 감지됐지만 미선언인 카테고리 → "정기 지출/수입 등록"(카테고리 recurrence 설정).
 * - remove: 정기 발생을 켰지만 최근 발생이 끊긴 카테고리 → "정기 발생 해제"(recurrence 제거).
 * 모두 읽기 시점 제안 — 영속 예측 doc 없음.
 */
export function RecurrenceSuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: RecurrenceSuggestionCardProps) {
  const isRemove = suggestion.kind === 'remove';
  const noun = kindNoun(suggestion.type);
  const amountText = suggestion.amount > 0 ? ` · 약 ${formatCurrency(suggestion.amount)}` : '';

  return (
    <div
      data-testid="recurrence-suggestion-card"
      data-kind={suggestion.kind}
      className="space-y-2.5 rounded-xl border border-dashed border-border bg-muted/40 p-3"
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            isRemove ? 'bg-stone-200 text-stone-600' : 'bg-sage-100 text-sage-600'
          )}
        >
          {isRemove ? <CalendarX size={13} /> : <Sparkle size={13} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {suggestion.categoryName}
            <span className="font-normal text-muted-foreground">
              {' · '}
              {suggestion.scheduleLabel}
              {amountText}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isRemove
              ? `최근 발생이 없어요. ${noun} 등록을 해제할까요?`
              : `이 카테고리를 ${noun} 항목으로 등록하면 현금흐름·내역 예측에 표시돼요`}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          className="flex-1"
          onClick={onAccept}
          data-testid="recurrence-suggestion-accept"
        >
          {isRemove ? <X size={14} className="mr-1" /> : <Check size={14} className="mr-1" />}
          {isRemove ? `${noun} 해제` : `${noun} 등록`}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          data-testid="recurrence-suggestion-dismiss"
          aria-label={isRemove ? '정기 발생 유지' : '제안 취소'}
        >
          {isRemove ? '유지' : '취소'}
        </Button>
      </div>
    </div>
  );
}
