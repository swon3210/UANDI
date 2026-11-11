'use client';

import { Check, Copy, Loader2, Share2 } from 'lucide-react';
import { useTranslations } from 'use-intl';
import { cn } from '../../lib/utils';
import { Button } from '../../components/button';

export type InviteCodePanelProps = {
  /** 6자리 초대 코드 */
  code: string;
  /** 코드 복사 직후 피드백 상태 (소비 측이 2초 뒤 되돌린다) */
  copied?: boolean;
  onCopy: () => void;
  /** 초대 링크 공유 (navigator.share → 없으면 링크 복사는 소비 측이 처리) */
  onShare: () => void;
  /**
   * "먼저 시작하기" — 온보딩 코드 화면에서만 전달. 대시보드 초대 시트에서는 생략한다.
   */
  onStart?: () => void;
  /** 만료 안내. 기본 "코드는 48시간 후 만료돼요" */
  expiresLabel?: string;
  /** 대기 안내. 기본 "짝꿍이 입력하면 여기서 바로 알려드릴게요" */
  waitingLabel?: string;
  /** 먼저 시작하기 아래 보조 문구. 기본 "짝꿍은 나중에 합류해도 돼요" */
  startHint?: string;
  className?: string;
};

/**
 * 초대 코드 패널 — 코드 표시 + 복사 + 링크 공유 (+ 먼저 시작하기).
 *
 * 온보딩 "짝꿍을 초대해요" 화면과 대시보드 초대 시트가 공유하는 프레젠테이션.
 * 코드 발급·클립보드·공유 API·라우팅은 모두 소비 측이 담당한다.
 */
export function InviteCodePanel({
  code,
  copied = false,
  onCopy,
  onShare,
  onStart,
  expiresLabel,
  waitingLabel,
  startHint,
  className,
}: InviteCodePanelProps) {
  const t = useTranslations('ui.onboarding');
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <p
        data-testid="invite-code"
        className="rounded-xl border border-border bg-secondary px-8 py-4 text-3xl font-bold tracking-[0.3em] text-foreground"
      >
        {code}
      </p>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="gap-1" onClick={onCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t('copied') : t('copyCode')}
        </Button>
        <Button variant="outline" size="sm" className="gap-1" onClick={onShare}>
          <Share2 size={14} />
          {t('shareLink')}
        </Button>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {expiresLabel ?? t('expires')}
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={14} aria-hidden />
        {waitingLabel ?? t('waiting')}
      </p>

      {onStart ? (
        <div className="mt-8 w-full max-w-sm">
          <Button className="w-full" size="lg" onClick={onStart} data-testid="start-alone">
            {t('startAlone')}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {startHint ?? t('startHint')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
