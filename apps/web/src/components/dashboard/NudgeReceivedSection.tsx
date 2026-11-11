'use client';

import { useTranslations } from 'next-intl';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { useCoupleMembers } from '@/hooks/useCoupleMembers';
import { useReceivedNudge, useRespondToNudge } from '@/hooks/useReceivedNudge';
import { NudgeReceivedCard } from './NudgeReceivedCard';

/**
 * 대시보드 커플 카드 아래 — 짝꿍이 보낸 pending 콕 찌르기가 있을 때만 카드를 보여준다.
 * 데이터 연결만 맡고 모양은 NudgeReceivedCard가 담당한다.
 */
export function NudgeReceivedSection() {
  const t = useTranslations('dashboard');
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? null;

  const nudge = useReceivedNudge(coupleId, uid);
  const { data: members } = useCoupleMembers(coupleId);
  const respond = useRespondToNudge(coupleId);

  if (!nudge) return null;

  const partnerName =
    members?.find((m) => m.uid === nudge.fromUid)?.displayName?.trim() || t('partnerFallback');

  return (
    <NudgeReceivedCard
      partnerName={partnerName}
      message={nudge.message}
      isPending={respond.isPending}
      onAdd={() =>
        respond.mutate(
          { nudgeId: nudge.id, status: 'seen' },
          { onSuccess: () => window.dispatchEvent(new Event('uandi:quick-add')) }
        )
      }
      onDismiss={() => respond.mutate({ nudgeId: nudge.id, status: 'dismissed' })}
    />
  );
}
