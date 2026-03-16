import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      coupleId: string;
      recordReminder: NotificationSettings['recordReminder'];
      budgetWarning: NotificationSettings['budgetWarning'];
    }) => updateNotificationSettings(userId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      toast.success('알림 설정이 저장되었습니다.');
    },
    onError: () => {
      toast.error('알림 설정 저장에 실패했습니다.');
    },
  });
}
