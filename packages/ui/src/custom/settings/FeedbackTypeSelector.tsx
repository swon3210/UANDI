'use client';

import { Bug, Lightbulb, MessageCircle, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type FeedbackType = 'bug' | 'idea' | 'other';

export const FEEDBACK_TYPE_OPTIONS: { value: FeedbackType; label: string; Icon: LucideIcon }[] = [
  { value: 'bug', label: '버그', Icon: Bug },
  { value: 'idea', label: '의견', Icon: Lightbulb },
  { value: 'other', label: '기타', Icon: MessageCircle },
];

export type FeedbackTypeSelectorProps = {
  value: FeedbackType | null;
  onValueChange: (value: FeedbackType) => void;
  disabled?: boolean;
  'aria-invalid'?: boolean;
};

/** 의견 보내기 유형 세그먼트(버그/의견/기타). 기본값 없이 시작한다. */
export function FeedbackTypeSelector({
  value,
  onValueChange,
  disabled,
  'aria-invalid': ariaInvalid,
}: FeedbackTypeSelectorProps) {
  return (
    <div role="radiogroup" aria-invalid={ariaInvalid} className="grid grid-cols-3 gap-2">
      {FEEDBACK_TYPE_OPTIONS.map(({ value: option, label, Icon }) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={`feedback-type-${option}`}
            disabled={disabled}
            onClick={() => onValueChange(option)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-[10px] border px-3 py-3 text-sm font-medium transition-colors disabled:opacity-50',
              selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-accent',
              ariaInvalid && !selected && 'border-destructive/60'
            )}
          >
            <Icon size={18} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
