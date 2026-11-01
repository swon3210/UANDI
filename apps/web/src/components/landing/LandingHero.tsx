'use client';

import Image from 'next/image';
import { Check, Mail } from 'lucide-react';
import { cn } from '@uandi/ui';
import mascotSplash from '@uandi/ui/assets/mascot-splash.png';

/** 랜딩에서 보여주는 기능 3줄. 내부 용어(우리집/재테크) 대신 처음 온 사람의 말로 쓴다. */
export const LANDING_FEATURES = [
  '수입·지출을 둘이 같이 기록해요',
  '영수증 사진·문장으로 자동 입력돼요',
  '한 해 예산과 현금흐름을 미리 그려요',
] as const;

export type LandingHeroProps = {
  /** 초대 링크로 들어와 저장된 코드. 있으면 상단에 초대 배너를 보여준다 */
  pendingInviteCode?: string | null;
  className?: string;
};

/**
 * 랜딩 상단 — 마스코트 + "말랑 가계부"가 보이는 헤드라인 + 기능 3줄.
 * 로그인 버튼·에러 처리는 LandingPage가 담당하고, 여기는 소개만 그린다.
 */
export function LandingHero({ pendingInviteCode, className }: LandingHeroProps) {
  return (
    <div data-testid="landing-hero" className={cn('flex flex-col items-center', className)}>
      {pendingInviteCode ? (
        <div
          data-testid="landing-invite-banner"
          className="mb-6 flex w-full max-w-sm items-start gap-3 rounded-2xl border border-coral-200 bg-coral-50 p-4 text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
            <Mail size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">초대 링크로 들어왔어요</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              로그인하면 바로 짝꿍과 연결돼요 · 코드{' '}
              <span className="font-mono font-semibold tracking-wider text-foreground">
                {pendingInviteCode}
              </span>
            </p>
          </div>
        </div>
      ) : null}

      <Image
        src={mascotSplash}
        alt="둘이 함께 가계부를 쓰는 말랑 마스코트"
        priority
        sizes="200px"
        draggable={false}
        className="h-auto w-[180px] select-none sm:w-[200px]"
      />

      <h1 className="mt-5 text-center text-2xl font-bold leading-tight text-foreground">
        둘이 함께 쓰는
        <br />
        말랑 가계부
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
        신혼부부의 살림을 둘이 같이 기록하고 계획해요
      </p>

      <ul data-testid="landing-features" className="mt-5 flex flex-col gap-1.5">
        {LANDING_FEATURES.map((text) => (
          <li key={text} className="flex items-center gap-2 text-sm text-foreground">
            <Check size={16} aria-hidden className="shrink-0 text-income" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
