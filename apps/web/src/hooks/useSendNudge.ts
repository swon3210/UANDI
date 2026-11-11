import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { getLatestNudgeForPartner, sendNudge } from '@/services/nudge';

const LATEST_KEY = 'nudge-latest';

/**
 * 파트너에게 마지막으로 보낸 넛지. 시간 기반 쿨다운 가드용.
 */
export function useLatestNudge(
  coupleId: string | null,
  fromUid: string | null,
  toUid: string | null
) {
  return useQuery({
    queryKey: [LATEST_KEY, coupleId, fromUid, toUid],
    queryFn: () => getLatestNudgeForPartner(coupleId!, fromUid!, toUid!),
    enabled: !!coupleId && !!fromUid && !!toUid,
  });
}

/**
 * 가계부 입력 요청 넛지 발송. 성공 시 최신 넛지 쿼리를 무효화해 쿨다운을 갱신한다.
 */
export function useSendNudge(
  coupleId: string | null,
  fromUid: string | null,
  toUid: string | null
) {
  const t = useTranslations('dashboard.nudge');
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      sendNudge({ coupleId: coupleId!, fromUid: fromUid!, toUid: toUid!, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LATEST_KEY, coupleId, fromUid, toUid] });
      toast.success(t('sent'));
    },
    onError: () => {
      toast.error(t('sendError'));
    },
  });
}
