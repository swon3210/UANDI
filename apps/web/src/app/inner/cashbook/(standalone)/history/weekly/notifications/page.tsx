'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Header } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/hooks/useNotificationSettings';
import { useFcmToken, type FcmEnableState } from '@/hooks/useFcmToken';
import { NotificationSettingsForm } from '@/components/cashbook/NotificationSettingsForm';
import { MascotLoader } from '@/components/MascotLoader';
import { BackButton } from '@/components/shell/BackButton';

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
    selfAlertInApp: true,
  },
  recurringTransaction: {
    enabled: true,
  },
  recordRequest: {
    enabled: true,
  },
  announcement: {
    enabled: true,
  },
};

export default function NotificationSettingsPage() {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const coupleId = user?.coupleId ?? '';

  const { data: settings, isPending } = useNotificationSettings(uid);
  const updateMutation = useUpdateNotificationSettings(uid);
  const { enable: enableFcm } = useFcmToken();

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
        announcement: {
          // 공지 알림은 2026-11 추가 — 없으면 켜짐(docs/pages/10-announcement-push.md).
          enabled: settings.announcement?.enabled ?? true,
        },
      }
    : DEFAULT_VALUES;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="알림 설정"
        data-testid="notification-settings-header"
        leftSlot={<BackButton fallbackHref="/inner/cashbook/settings" />}
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-12">
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
                announcement: data.announcement,
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
      </main>
    </div>
  );
}
