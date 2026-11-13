import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/services/notification-settings';
import type { NotificationSettings } from '@/types';

const QUERY_KEY = 'notification-settings';

export function useNotificationSettings(userId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => getNotificationSettings(userId!),
    enabled: !!userId,
  });
}

export function useUpdateNotificationSettings(userId: string | null) {
  const t = useTranslations('cashbook.notifications');
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      coupleId: string;
      recordReminder: NotificationSettings['recordReminder'];
      budgetWarning: NotificationSettings['budgetWarning'];
      recurringTransaction?: NotificationSettings['recurringTransaction'];
      recordRequest?: NotificationSettings['recordRequest'];
    }) => updateNotificationSettings(userId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      toast.success(t('saved'));
    },
    onError: () => {
      toast.error(t('saveFailed'));
    },
  });
}
