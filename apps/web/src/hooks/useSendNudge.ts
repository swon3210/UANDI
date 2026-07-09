import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPendingNudgeForPartner, sendNudge } from '@/services/nudge';

const PENDING_KEY = 'nudge-pending';

/**
 * 파트너에게 보낸 미응답(pending) 넛지 존재 여부. 쿨다운 가드용.
 */
export function usePendingNudge(
  coupleId: string | null,
  fromUid: string | null,
  toUid: string | null
) {
  return useQuery({
    queryKey: [PENDING_KEY, coupleId, fromUid, toUid],
    queryFn: () => getPendingNudgeForPartner(coupleId!, fromUid!, toUid!),
    enabled: !!coupleId && !!fromUid && !!toUid,
  });
}

/**
 * 가계부 입력 요청 넛지 발송. 성공 시 pending 쿼리를 무효화한다.
 */
export function useSendNudge(
  coupleId: string | null,
  fromUid: string | null,
  toUid: string | null
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      sendNudge({ coupleId: coupleId!, fromUid: fromUid!, toUid: toUid!, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PENDING_KEY, coupleId, fromUid, toUid] });
      toast.success('입력 요청을 보냈어요 🐹');
    },
    onError: () => {
      toast.error('요청 전송에 실패했어요. 잠시 후 다시 시도해 주세요.');
    },
  });
}
