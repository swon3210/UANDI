'use client';

import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { Hand } from 'lucide-react';
import { Button, Sheet, NudgeComposer } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCoupleMembers } from '@/hooks/useCoupleMembers';
import { usePendingNudge, useSendNudge } from '@/hooks/useSendNudge';

const PENDING_REASON = '이미 입력 요청을 보냈어요. 파트너가 확인하면 다시 보낼 수 있어요.';

/**
 * 콕 찌르기 시트 내용. overlay-kit으로 매번 새로 마운트되므로 훅을 직접 구독해
 * pending/뮤테이션을 최신 상태로 사용한다(이벤트 핸들러의 stale closure 회피).
 */
function NudgeSheetContent({
  coupleId,
  fromUid,
  toUid,
  partnerName,
  onClose,
}: {
  coupleId: string;
  fromUid: string;
  toUid: string;
  partnerName: string;
  onClose: () => void;
}) {
  const { data: pending } = usePendingNudge(coupleId, fromUid, toUid);
  const sendMutation = useSendNudge(coupleId, fromUid, toUid);

  const hasPending = !!pending;

  return (
    <NudgeComposer
      partnerName={partnerName}
      isPending={sendMutation.isPending}
      disabled={hasPending}
      disabledReason={hasPending ? PENDING_REASON : undefined}
      onSubmit={(message) =>
        sendMutation.mutate(message, {
          onSuccess: () => onClose(),
        })
      }
    />
  );
}

/**
 * 대시보드에서 파트너에게 가계부 입력을 요청하는 "콕 찌르기" 진입점.
 * 커플이 연결된(멤버 2명) 경우에만 노출한다.
 */
export function NudgeButton() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? null;

  const { data: members } = useCoupleMembers(coupleId);
  const partner = members?.find((m) => m.uid !== uid) ?? null;

  // 커플 미연결 또는 파트너 없음 → 노출하지 않음
  if (!coupleId || !uid || !partner) return null;

  const partnerName = partner.displayName?.trim() || '파트너';

  const handleClick = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <NudgeSheetContent
          coupleId={coupleId}
          fromUid={uid}
          toUid={partner.uid}
          partnerName={partnerName}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
      data-testid="nudge-button"
    >
      <Hand size={16} className="mr-2" />
      {partnerName}님 콕 찌르기
    </Button>
  );
}
