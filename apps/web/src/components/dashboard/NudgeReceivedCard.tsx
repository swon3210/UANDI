'use client';

import { useTranslations } from 'next-intl';
import { Hand, Loader2 } from 'lucide-react';
import { Button } from '@uandi/ui';

type NudgeReceivedCardProps = {
  /** 요청을 보낸 짝꿍 이름 */
  partnerName: string;
  /** 요청 문구. 비어 있으면 기본 안내를 보여준다 */
  message: string;
  /** [내역 적기] — 상태를 seen으로 바꾸고 빠른 추가 시트를 연다 */
  onAdd: () => void;
  /** [나중에] — 상태를 dismissed로 */
  onDismiss: () => void;
  /** 응답 저장 중이면 버튼을 잠근다 */
  isPending?: boolean;
  className?: string;
};

/**
 * 대시보드의 "받은 콕 찌르기" 카드.
 * 푸시가 오지 않는 환경(웹·푸시 미허용·함수 미배포)에서도 짝꿍의 요청을 앱 안에서 알 수 있게 한다.
 * 2026-11 걷기 6구간: 보낸 쪽만 토스트가 뜨고 받는 쪽엔 아무것도 없었다.
 */
export function NudgeReceivedCard({
  partnerName,
  message,
  onAdd,
  onDismiss,
  isPending = false,
  className,
}: NudgeReceivedCardProps) {
  const t = useTranslations('dashboard.nudge');
  const body = message.trim() || t('fallbackMessage');

  return (
    <section
      data-testid="nudge-received"
      aria-label={t('ariaLabel', { name: partnerName })}
      className={['rounded-xl border border-coral-200 bg-coral-50 p-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-100 text-coral-600"
          aria-hidden
        >
          <Hand size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {t('title', { name: partnerName })}
          </h3>
          <p className="mt-0.5 break-words text-sm text-muted-foreground">“{body}”</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          disabled={isPending}
          data-testid="nudge-received-dismiss"
        >
          {t('later')}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onAdd}
          disabled={isPending}
          data-testid="nudge-received-add"
        >
          {isPending ? <Loader2 className="mr-1 animate-spin" size={14} aria-hidden /> : null}
          {t('add')}
        </Button>
      </div>
    </section>
  );
}
