'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { Header, Button, FullScreenSpinner } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/hooks/useNotificationSettings';
import { NotificationSettingsForm } from '@/components/cashbook/NotificationSettingsForm';

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
            updateMutation.mutate({
              coupleId,
              recordReminder: data.recordReminder,
              budgetWarning: data.budgetWarning,
            })
          }
          isSaving={updateMutation.isPending}
        />
      </main>
    </div>
  );
}
