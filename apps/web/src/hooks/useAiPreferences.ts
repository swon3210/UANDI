import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preferences: AiPreferences) => saveAiPreferences(preferences),
    onSuccess: (saved) => {
      qc.setQueryData([QUERY_KEY, coupleId], saved);
      toast.success('AI 설정을 저장했어요.');
    },
    onError: () => {
      toast.error('AI 설정 저장에 실패했어요. 다시 시도해주세요.');
    },
  });
}
