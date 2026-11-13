'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import type { MessagePayload } from 'firebase/messaging';
import { Button, Toaster } from '@uandi/ui';
import { showForegroundFcmToast } from '@/lib/fcm/foreground-toast';

// Storybook visual preview용 컴포넌트.
// 실제 onMessage subscription 없이 동일한 payload shape으로 toast 동작을 확인한다.
type FcmForegroundToastPreviewProps = {
  selfAlertEnabled: boolean;
};

const buildPayloads = (
  t: ReturnType<typeof useTranslations<'cashbook.notifications.preview'>>
) => ({
  partner: {
    notification: {
      title: t('appName'),
      body: t('partnerBody'),
    },
    data: {
      click_action: '/inner/cashbook',
      scopeId: 'category-food',
      threshold: 'warn80',
      recipient: 'partner',
    },
    from: 'preview',
    collapseKey: '',
    messageId: 'preview-partner',
  } as MessagePayload,
  self: {
    notification: {
      title: t('appName'),
      body: t('selfBody'),
    },
    data: {
      click_action: '/inner/cashbook',
      scopeId: 'category-cafe',
      threshold: 'over100',
      recipient: 'self',
    },
    from: 'preview',
    collapseKey: '',
    messageId: 'preview-self',
  } as MessagePayload,
});

export function FcmForegroundToastPreview({ selfAlertEnabled }: FcmForegroundToastPreviewProps) {
  const t = useTranslations('cashbook.notifications.preview');
  const payloads = buildPayloads(t);
  const handleClick = useCallback((path: string) => {
    // storybook 환경에선 라우팅 대신 콘솔로만 출력
    console.log('toast action clicked → router.push', path);
  }, []);

  const trigger = (payload: MessagePayload) => {
    showForegroundFcmToast(payload, {
      selfAlertEnabled,
      onAction: handleClick,
    });
  };

  return (
    <div className="flex min-h-[320px] flex-col gap-3 p-6">
      <p className="text-sm text-muted-foreground">{t('description')}</p>
      <p className="text-xs text-muted-foreground">
        selfAlertEnabled = <code>{String(selfAlertEnabled)}</code>
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={() => trigger(payloads.partner)} className="w-full">
          {t('partner')}
        </Button>
        <Button variant="secondary" onClick={() => trigger(payloads.self)} className="w-full">
          {t('self')}
        </Button>
      </div>
      <Toaster />
    </div>
  );
}
