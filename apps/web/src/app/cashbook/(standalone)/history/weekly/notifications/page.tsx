'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Header, Button, FullScreenSpinner, Separator } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/hooks/useNotificationSettings';
import { useFcmToken, type FcmEnableState } from '@/hooks/useFcmToken';
import { NotificationSettingsForm } from '@/components/cashbook/NotificationSettingsForm';
import { sendTestPush } from '@/services/test-push';

function reportFcmResult(result: FcmEnableState) {
  if (result === 'denied') {
    toast.error('브라우저 알림 권한이 거부되어 푸시 알림을 받을 수 없어요.');
  } else if (result === 'unsupported') {
    toast.error('이 브라우저에서는 푸시 알림을 지원하지 않아요.');
  } else if (result === 'error') {
    toast.error('푸시 알림 등록에 실패했어요. 잠시 후 다시 시도해주세요.');
  }
}

const DEFAULT_VALUES = {
  recordReminder: {
    enabled: false,
    time: '21:00',
    days: [1, 2, 3, 4, 5],
  },
  budgetWarning: {
    enabled: true,
  },
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const coupleId = user?.coupleId ?? '';

  const { data: settings, isPending } = useNotificationSettings(uid);
  const updateMutation = useUpdateNotificationSettings(uid);
  const { enable: enableFcm } = useFcmToken();
  const [testPushSending, setTestPushSending] = useState(false);

  const handleSendTestPush = async () => {
    setTestPushSending(true);
    try {
      const result = await sendTestPush();
      if (result.successCount > 0) {
        toast.success(
          `테스트 푸시를 발송했어요 (성공 ${result.successCount}, 실패 ${result.failureCount})`
        );
      } else {
        toast.error(
          `발송에 모두 실패했어요. 첫 실패 사유: ${result.failures[0]?.error ?? '알 수 없음'}`
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : '테스트 푸시 발송에 실패했어요.';
      toast.error(message);
    } finally {
      setTestPushSending(false);
    }
  };

  const shouldAutoEnable =
    !!settings && (settings.budgetWarning.enabled || settings.recordReminder.enabled);

  // 저장 직후 settings refetch로 shouldAutoEnable이 다시 true가 될 때 onSave 쪽 enable과 중복
  // 호출되어 SW 등록 레이스가 나는 것을 막기 위해 mount 동안 1회만 트리거한다.
  const autoEnableTriggeredRef = useRef(false);

  // 다른 디바이스에서 이미 알림을 켠 사용자가 이 디바이스에서는 토큰이 등록되지 않은 채로
  // 사용하는 경우를 막기 위해, 권한이 이미 granted라면 진입 시 자동 등록한다.
  // 권한 다이얼로그는 항상 사용자 액션(저장 버튼)에서만 띄운다.
  useEffect(() => {
    if (autoEnableTriggeredRef.current) return;
    if (!shouldAutoEnable) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    autoEnableTriggeredRef.current = true;
    void enableFcm({ skipPermissionPrompt: true });
  }, [shouldAutoEnable, enableFcm]);

  if (isPending) return <FullScreenSpinner />;

  const formValues = settings
    ? {
        recordReminder: settings.recordReminder,
        budgetWarning: settings.budgetWarning,
      }
    : DEFAULT_VALUES;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="알림 설정"
        data-testid="notification-settings-header"
        leftSlot={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.back()}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={20} />
          </Button>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4">
        <NotificationSettingsForm
          defaultValues={formValues}
          onSave={(data) =>
            updateMutation.mutate(
              {
                coupleId,
                recordReminder: data.recordReminder,
                budgetWarning: data.budgetWarning,
              },
              {
                onSuccess: async () => {
                  if (data.budgetWarning.enabled || data.recordReminder.enabled) {
                    const result = await enableFcm();
                    reportFcmResult(result);
                  }
                },
              }
            )
          }
          isSaving={updateMutation.isPending}
        />

        <Separator className="my-6" />

        <section className="space-y-2 pb-12" data-testid="test-push-section">
          <h3 className="text-base font-semibold">알림 동작 확인</h3>
          <p className="text-sm text-muted-foreground">
            등록된 디바이스로 테스트 푸시를 1건 발송해 셋업이 정상인지 확인할 수 있어요.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSendTestPush}
            disabled={testPushSending}
            data-testid="send-test-push-button"
          >
            {testPushSending ? '발송 중…' : '테스트 푸시 보내기'}
          </Button>
        </section>
      </main>
    </div>
  );
}
