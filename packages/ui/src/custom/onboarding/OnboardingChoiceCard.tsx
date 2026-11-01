'use client';

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export type OnboardingChoiceCardProps = {
  /** 왼쪽 아이콘 (lucide 등) */
  icon: ReactNode;
  /** 한 줄 제목. 예: "처음 시작해요" */
  title: string;
  /** 무엇이 일어나는지 설명. 예: "새 공간을 만들고 짝꿍을 초대해요" */
  description: string;
  /**
   * 접근성 이름(버튼 역할의 name). 화면 문구와 별개로 행동을 설명한다.
   * 예: "새 커플 공간 만들기" / "초대 코드 입력하기"
   */
  ariaLabel: string;
  onClick: () => void;
  testId?: string;
  className?: string;
};

/**
 * 온보딩 선택 화면의 선택 카드.
 *
 * "처음 시작하는 사람"과 "초대받은 사람"이 같은 무게로 나란히 놓이도록 둘 다 이 카드를 쓴다.
 * 한쪽만 primary 버튼으로 강조하면 초대받은 사람이 습관적으로 "새 공간 만들기"를 눌러
 * 혼자짜리 공간이 하나 더 생긴다.
 */
export function OnboardingChoiceCard({
  icon,
  title,
  description,
  ariaLabel,
  onClick,
  testId,
  className,
}: OnboardingChoiceCardProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors',
        'hover:border-primary/40 hover:bg-accent active:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
      <ChevronRight size={18} aria-hidden className="shrink-0 text-muted-foreground" />
    </button>
  );
}
