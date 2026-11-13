import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { AiPreferences } from '@uandi/ui';
import { fetchAiPreferences, saveAiPreferences } from '@/services/ai-preferences';

const QUERY_KEY = 'aiPreferences';

/** 커플의 AI 프롬프트 맞춤화 설정 조회. */
export function useAiPreferences(coupleId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId],
    queryFn: fetchAiPreferences,
    enabled: !!coupleId,
  });
}

/** AI 프롬프트 맞춤화 설정 저장. */
export function useSaveAiPreferences(coupleId: string | null) {
  const t = useTranslations('settings.aiPage');
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preferences: AiPreferences) => saveAiPreferences(preferences),
    onSuccess: (saved) => {
      qc.setQueryData([QUERY_KEY, coupleId], saved);
      toast.success(t('saved'));
    },
    onError: () => {
      toast.error(t('saveError'));
    },
  });
}
