'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import { Header, Button, Separator } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/hooks/useNotificationSettings';
import { useFcmToken, type FcmEnableState } from '@/hooks/useFcmToken';
import { NotificationSettingsForm } from '@/components/cashbook/NotificationSettingsForm';
import { InstallPwaBanner } from '@/components/InstallPwaBanner';
import { MascotLoader } from '@/components/MascotLoader';
import { sendTestPush } from '@/services/test-push';
import { BackButton } from '@/components/shell/BackButton';

type NotiT = ReturnType<typeof useTranslations<'cashbook.notifications'>>;
function reportFcmResult(result: FcmEnableState, t: NotiT) {
  if (result === 'denied') {
    toast.error(t('denied'));
  } else if (result === 'unsupported') {
    toast.error(t('unsupported'));
  } else if (result === 'error') {
    toast.error(t('registerFailed'));
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
    selfAlertInApp: true,
  },
  recurringTransaction: {
    enabled: true,
  },
  recordRequest: {
    enabled: true,
  },
};

export default function NotificationSettingsPage() {
  const t = useTranslations('cashbook.notifications');
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const coupleId = user?.coupleId ?? '';

  const { data: settings, isPending } = useNotificationSettings(uid);
  const updateMutation = useUpdateNotificationSettings(uid);
  const { enable: enableFcm } = useFcmToken();
  const [testPushSending, setTestPushSending] = useState(false);

  const handleOpenInstallGuide = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <InstallPwaBanner
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            close();
            setTimeout(unmount, 300);
          }
        }}
      />
    ));
  };

  const handleSendTestPush = async () => {
    setTestPushSending(true);
    try {
      const result = await sendTestPush();
      if (result.successCount > 0) {
        toast.success(
          t('testSent', { success: result.successCount, failure: result.failureCount })
        );
      } else {
        toast.error(t('testAllFailed', { reason: result.failures[0]?.error ?? t('unknown') }));
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t('testFailed');
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

  if (isPending) return <MascotLoader fullScreen />;

  const formValues = settings
    ? {
        recordReminder: settings.recordReminder,
        budgetWarning: {
          enabled: settings.budgetWarning.enabled,
          // 기존 사용자 문서에는 selfAlertInApp이 없을 수 있어 기본값 true 보정.
          selfAlertInApp: settings.budgetWarning.selfAlertInApp ?? true,
        },
        recurringTransaction: {
          // 기존 사용자 문서에는 recurringTransaction이 없을 수 있어 기본값 true 보정.
          enabled: settings.recurringTransaction?.enabled ?? true,
        },
        recordRequest: {
          // 기존 사용자 문서에는 recordRequest가 없을 수 있어 기본값 true 보정.
          enabled: settings.recordRequest?.enabled ?? true,
        },
      }
    : DEFAULT_VALUES;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title={t('title')}
        data-testid="notification-settings-header"
        leftSlot={<BackButton fallbackHref="/inner/cashbook/settings" />}
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
                recurringTransaction: data.recurringTransaction,
                recordRequest: data.recordRequest,
              },
              {
                onSuccess: async () => {
                  if (data.budgetWarning.enabled || data.recordReminder.enabled) {
                    const result = await enableFcm();
                    reportFcmResult(result, t);
                  }
                },
              }
            )
          }
          isSaving={updateMutation.isPending}
        />

        <Separator className="my-6" />

        <section className="space-y-2" data-testid="install-pwa-section">
          <h3 className="text-base font-semibold">{t('pwaTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('pwaDescription')}</p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleOpenInstallGuide}
            data-testid="open-install-pwa-guide-button"
          >
            <Smartphone size={16} className="mr-2" />
            {t('pwaHow')}
          </Button>
        </section>

        <Separator className="my-6" />

        <section className="space-y-2 pb-12" data-testid="test-push-section">
          <h3 className="text-base font-semibold">{t('testTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('testDescription')}</p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSendTestPush}
            disabled={testPushSending}
            data-testid="send-test-push-button"
          >
            {testPushSending ? t('testSending') : t('testSend')}
          </Button>
        </section>
      </main>
    </div>
  );
}
