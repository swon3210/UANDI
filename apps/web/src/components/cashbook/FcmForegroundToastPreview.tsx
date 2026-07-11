'use client';

import { useCallback } from 'react';
import type { MessagePayload } from 'firebase/messaging';
import { Button, Toaster } from '@uandi/ui';
import { showForegroundFcmToast } from '@/lib/fcm/foreground-toast';

// Storybook visual preview용 컴포넌트.
// 실제 onMessage subscription 없이 동일한 payload shape으로 toast 동작을 확인한다.
type FcmForegroundToastPreviewProps = {
  selfAlertEnabled: boolean;
};

const PARTNER_PAYLOAD: MessagePayload = {
  notification: {
    title: '말랑 가계부',
    body: '이번 달 식비가 예산의 80%를 넘었어요',
  },
  data: {
    click_action: '/inner/cashbook/history/monthly',
    scopeId: 'category-food',
    threshold: 'warn80',
    recipient: 'partner',
  },
  from: 'preview',
  collapseKey: '',
  messageId: 'preview-partner',
};

const SELF_PAYLOAD: MessagePayload = {
  notification: {
    title: '말랑 가계부',
    body: '[내 지출] 이번 달 카페가 예산을 넘었어요',
  },
  data: {
    click_action: '/inner/cashbook/history/monthly',
    scopeId: 'category-cafe',
    threshold: 'over100',
    recipient: 'self',
  },
  from: 'preview',
  collapseKey: '',
  messageId: 'preview-self',
};

export function FcmForegroundToastPreview({ selfAlertEnabled }: FcmForegroundToastPreviewProps) {
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
      <p className="text-sm text-muted-foreground">
        포그라운드 상태에서 FCM 메시지를 받았을 때 표시되는 토스트 미리보기.
      </p>
      <p className="text-xs text-muted-foreground">
        selfAlertEnabled = <code>{String(selfAlertEnabled)}</code>
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={() => trigger(PARTNER_PAYLOAD)} className="w-full">
          파트너 알림 (warn80) 띄우기
        </Button>
        <Button variant="secondary" onClick={() => trigger(SELF_PAYLOAD)} className="w-full">
          본인 알림 (over100) 띄우기
        </Button>
      </div>
      <Toaster />
    </div>
  );
}
