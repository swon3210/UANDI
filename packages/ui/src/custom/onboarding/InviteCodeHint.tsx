'use client';

import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'use-intl';
import { cn } from '../../lib/utils';

export type InviteCodeHintStatus = 'idle' | 'loading' | 'found' | 'unavailable';

export type InviteCodeHintProps = {
  status: InviteCodeHintStatus;
  /** 초대한 사람 이름. 구버전 코드엔 없을 수 있다 */
  inviterName?: string | null;
  className?: string;
};

/**
 * 코드 입력 화면의 미리보기 한 줄 — "진성님의 초대예요".
 *
 * 6자리를 다 치면 소비 측이 inviteCodes/{code}를 조회해 status를 넘긴다.
 * idle / unavailable(없음·만료·만석)에서는 아무것도 그리지 않는다 — 실제 거절 사유는
 * 연결하기를 눌렀을 때 에러 메시지로 알려 준다.
 */
export function InviteCodeHint({ status, inviterName, className }: InviteCodeHintProps) {
  const t = useTranslations('ui.onboarding');
  if (status === 'idle' || status === 'unavailable') return null;

  if (status === 'loading') {
    return (
      <p
        data-testid="invite-hint"
        className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}
      >
        <Loader2 size={14} className="animate-spin" aria-hidden />
        {t('checkingCode')}
      </p>
    );
  }

  const name = inviterName?.trim();
  return (
    <p
      data-testid="invite-hint"
      className={cn('flex items-center gap-1.5 text-sm font-medium text-sage-600', className)}
    >
      <Check size={14} aria-hidden />
      {name ? t('inviteFrom', { name }) : t('codeConfirmed')}
    </p>
  );
}
