'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Check, Mail } from 'lucide-react';
import { cn } from '@uandi/ui';
import mascotSplash from '@uandi/ui/assets/mascot-splash.png';

/** 랜딩에서 보여주는 기능 3줄(메시지 키). 내부 용어(우리집/재테크) 대신 처음 온 사람의 말로 쓴다. */
const LANDING_FEATURE_KEYS = ['record', 'autoInput', 'plan'] as const;

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
  const t = useTranslations('landing');

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
            <p className="text-sm font-semibold text-foreground">{t('inviteBanner.title')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {t.rich('inviteBanner.description', {
                code: () => (
                  <span className="font-mono font-semibold tracking-wider text-foreground">
                    {pendingInviteCode}
                  </span>
                ),
              })}
            </p>
          </div>
        </div>
      ) : null}

      <Image
        src={mascotSplash}
        alt={t('mascotAlt')}
        priority
        sizes="200px"
        draggable={false}
        className="h-auto w-[180px] select-none sm:w-[200px]"
      />

      <h1 className="mt-5 text-center text-2xl font-bold leading-tight text-foreground">
        {t.rich('headline', { br: () => <br /> })}
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
        {t('subheadline')}
      </p>

      <ul data-testid="landing-features" className="mt-5 flex flex-col gap-1.5">
        {LANDING_FEATURE_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-2 text-sm text-foreground">
            <Check size={16} aria-hidden className="shrink-0 text-income" />
            {t(`features.${key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
