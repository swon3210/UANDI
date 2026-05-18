import { toast } from 'sonner';
import type { MessagePayload } from 'firebase/messaging';

export type ForegroundToastOptions = {
  onAction: (clickAction: string) => void;
  selfAlertEnabled: boolean;
};

const DEFAULT_CLICK_ACTION = '/cashbook/history/monthly';

// 백그라운드 SW(firebase-messaging-sw.js)와 동일한 payload shape을 가정.
// 자세한 정의는 functions/src/notifications/budgetAlert.ts 참고.
export function showForegroundFcmToast(
  payload: MessagePayload,
  options: ForegroundToastOptions
): void {
  const title = payload.notification?.title ?? 'UANDI 가계부';
  const body = payload.notification?.body ?? '';
  const clickAction = payload.data?.click_action ?? DEFAULT_CLICK_ACTION;
  const recipient = payload.data?.recipient;
  const isSelf = recipient === 'self';

  // 본인 지출로 인한 알림은 in-app toast를 끌 수 있다.
  if (isSelf && !options.selfAlertEnabled) return;

  const action = {
    label: '보기',
    onClick: () => options.onAction(clickAction),
  };

  if (isSelf) {
    // 본인 행동의 결과이므로 덜 침습적으로 (짧은 duration, 기본 스타일)
    toast(title, {
      description: body,
      duration: 3000,
      action,
    });
    return;
  }

  toast.warning(title, {
    description: body,
    duration: 6000,
    action,
  });
}
