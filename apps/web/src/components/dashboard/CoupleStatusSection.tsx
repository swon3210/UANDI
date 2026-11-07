'use client';

import { useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { toast } from 'sonner';
import {
  CoupleMessageComposer,
  CoupleStatusCard,
  InviteCodePanel,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from '@uandi/ui';
import coralMascot from '@uandi/ui/assets/mascot-couple-coral.png';
import sageMascot from '@uandi/ui/assets/mascot-couple-sage.png';
import splashMascot from '@uandi/ui/assets/mascot-splash.png';
import { userAtom } from '@/stores/auth.store';
import { useCoupleMembers } from '@/hooks/useCoupleMembers';
import { useCoupleConnection } from '@/hooks/useCoupleConnection';
import {
  PRESENCE_ONLINE_THRESHOLD_MS,
  useCouplePresence,
  usePresenceHeartbeat,
  useSetCoupleMessage,
} from '@/hooks/useCouplePresence';
import { ensureActiveInviteCode } from '@/services/couple';
import { getUserDocumentWithRetry } from '@/services/user';
import { shareInviteLink } from '@/lib/share-invite';
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
 * 짝꿍 초대 시트 — 현재 유효한 초대 코드(없거나 만료됐으면 새로 발급)를 보여준다.
 * 온보딩 코드 화면과 같은 InviteCodePanel을 쓰되 "먼저 시작하기"는 없다(이미 들어와 있으므로).
 */
function InviteSheetContent({
  coupleId,
  uid,
  displayName,
}: {
  coupleId: string;
  uid: string;
  displayName: string;
}) {
  const { data: code, isError } = useQuery({
    queryKey: ['inviteCode', coupleId],
    queryFn: () => ensureActiveInviteCode(coupleId, uid, displayName),
    staleTime: 60 * 1000,
  });
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SheetContent
      side="bottom"
      data-testid="invite-sheet"
      className="rounded-t-[20px] max-h-[90vh]"
    >
      <SheetHeader>
        <SheetTitle>짝꿍을 초대해요</SheetTitle>
        <SheetDescription>코드나 링크를 짝꿍에게 보내 주세요</SheetDescription>
      </SheetHeader>
      <div className="py-4">
        {code ? (
          <InviteCodePanel
            code={code}
            copied={copied}
            onCopy={handleCopy}
            onShare={() => shareInviteLink(code, copyToClipboard)}
            waitingLabel="짝꿍이 들어오면 홈 화면이 바로 바뀌어요"
          />
        ) : isError ? (
          <p className="text-center text-sm text-destructive">
            초대 코드를 불러오지 못했어요. 잠시 후 다시 열어 주세요
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-48 rounded-xl" />
            <Skeleton className="h-8 w-40 rounded-md" />
          </div>
        )}
      </div>
    </SheetContent>
  );
}

/**
 * 대시보드 최상단 커플 카드 섹션 — 접속 상태 + 서로를 위한 한마디.
 * 짝꿍이 아직 없으면(혼자 먼저 시작) 초대 카드를 보여주고, 합류 순간을 실시간으로 받아
 * 새로고침 없이 연결 카드로 바꾼다.
 */
export function CoupleStatusSection() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? null;
  const queryClient = useQueryClient();
  // 열려 있는 초대 시트 id — 짝꿍이 합류하면 닫는다
  const inviteOverlayRef = useRef<string | null>(null);

  usePresenceHeartbeat(coupleId, uid);
  const { presence, nowMs } = useCouplePresence(coupleId);
  const { data: members, isLoading } = useCoupleMembers(coupleId);

  const meUser = members?.find((m) => m.uid === uid) ?? null;
  const partnerUser = members?.find((m) => m.uid !== uid) ?? null;
  const waitingForPartner = Boolean(members) && !partnerUser;

  useCoupleConnection(coupleId, uid, {
    enabled: waitingForPartner,
    onPartnerJoined: async (partnerUid) => {
      // 상대 users 문서의 coupleId 반영이 한 박자 늦을 수 있어 읽힐 때까지 기다린 뒤 갱신
      const partner = await getUserDocumentWithRetry(partnerUid);
      await queryClient.invalidateQueries({ queryKey: ['coupleMembers', coupleId] });
      if (inviteOverlayRef.current) {
        overlay.close(inviteOverlayRef.current);
        inviteOverlayRef.current = null;
      }
      toast.success(`${partner?.displayName?.trim() || '짝꿍'}님이 합류했어요`);
    },
  });

  if (!coupleId || !uid) return null;

  if (isLoading || !members) {
    return <CoupleStatusCard state="loading" />;
  }

  // 짝꿍 미연결 — 초대 카드
  if (!partnerUser) {
    const handleInvite = () => {
      const displayName = user?.displayName ?? '';
      inviteOverlayRef.current = overlay.open(({ isOpen, close, unmount }) => (
        <Sheet
          open={isOpen}
          onOpenChange={(open) => {
            if (open) return;
            close();
            setTimeout(unmount, 300);
            inviteOverlayRef.current = null;
          }}
        >
          <InviteSheetContent coupleId={coupleId} uid={uid} displayName={displayName} />
        </Sheet>
      ));
    };

    return <CoupleStatusCard state="invite" mascotSrc={splashMascot.src} onInvite={handleInvite} />;
  }

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
