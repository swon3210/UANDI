'use client';

import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { CoupleMessageComposer, CoupleStatusCard, Sheet } from '@uandi/ui';
import coralMascot from '@uandi/ui/assets/mascot-couple-coral.png';
import sageMascot from '@uandi/ui/assets/mascot-couple-sage.png';
import { userAtom } from '@/stores/auth.store';
import { useCoupleMembers } from '@/hooks/useCoupleMembers';
import {
  PRESENCE_ONLINE_THRESHOLD_MS,
  useCouplePresence,
  usePresenceHeartbeat,
  useSetCoupleMessage,
} from '@/hooks/useCouplePresence';
import { formatRelativeTime } from '@/utils/date';

/**
 * 편집 시트 내용. overlay-kit으로 매번 새로 마운트되므로 뮤테이션 훅을 직접 구독해
 * 최신 상태로 사용한다(이벤트 핸들러의 stale closure 회피).
 */
function CoupleMessageSheetContent({
  coupleId,
  uid,
  partnerName,
  initialMessage,
  onClose,
}: {
  coupleId: string;
  uid: string;
  partnerName: string;
  initialMessage: string | null;
  onClose: () => void;
}) {
  const mutation = useSetCoupleMessage(coupleId, uid);

  return (
    <CoupleMessageComposer
      partnerName={partnerName}
      initialMessage={initialMessage}
      isPending={mutation.isPending}
      onSubmit={(message) => mutation.mutate(message, { onSuccess: () => onClose() })}
    />
  );
}

/**
 * 대시보드 최상단 커플 카드 섹션 — 접속 상태 + 서로를 위한 한마디.
 * 파트너가 아직 없으면(연결 대기) 노출하지 않는다(NudgeButton과 동일 정책).
 */
export function CoupleStatusSection() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? null;

  usePresenceHeartbeat(coupleId, uid);
  const { presence, nowMs } = useCouplePresence(coupleId);
  const { data: members, isLoading } = useCoupleMembers(coupleId);

  if (!coupleId || !uid) return null;

  if (isLoading || !members) {
    return <CoupleStatusCard state="loading" />;
  }

  const meUser = members.find((m) => m.uid === uid) ?? null;
  const partnerUser = members.find((m) => m.uid !== uid) ?? null;

  // 파트너 미연결(연결 대기 중) → 카드 숨김
  if (!partnerUser) return null;

  const myEntry = presence[uid];
  const partnerEntry = presence[partnerUser.uid];

  const partnerLastSeenMs = partnerEntry?.lastSeen ? partnerEntry.lastSeen.toMillis() : null;
  const isOnline =
    partnerLastSeenMs != null && nowMs - partnerLastSeenMs < PRESENCE_ONLINE_THRESHOLD_MS;

  const partnerName = partnerUser.displayName?.trim() || '짝꿍';
  const myName = meUser?.displayName?.trim() || '나';

  const handleEdit = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CoupleMessageSheetContent
          coupleId={coupleId}
          uid={uid}
          partnerName={partnerName}
          initialMessage={myEntry?.message ?? null}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  return (
    <CoupleStatusCard
      state="connected"
      me={{ name: myName, message: myEntry?.message ?? null, mascotSrc: coralMascot.src }}
      partner={{
        name: partnerName,
        message: partnerEntry?.message ?? null,
        mascotSrc: sageMascot.src,
      }}
      partnerPresence={isOnline ? 'online' : 'offline'}
      partnerLastSeenLabel={
        partnerEntry?.lastSeen ? formatRelativeTime(partnerEntry.lastSeen) : undefined
      }
      onEditMyMessage={handleEdit}
    />
  );
}
