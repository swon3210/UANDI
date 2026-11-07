import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Nudge, NudgeStatus } from '@/types';

/** 콕 찌르기 재발송 쿨다운(ms). 마지막 발송 후 이 시간이 지나야 다시 보낼 수 있다. */
export const NUDGE_COOLDOWN_MS = 30 * 60 * 1000; // 30분

function nudgesCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/nudges`);
}

/**
 * 파트너에게 마지막으로 보낸 넛지 1건을 반환한다(상태 무관). 없으면 null.
 * 시간 기반 쿨다운 가드에 사용 — 상대의 응답 여부가 아니라 마지막 발송 시각으로 판단한다.
 * (상대가 푸시를 못 받거나 응답하지 못해도 쿨다운이 지나면 다시 보낼 수 있다.)
 */
export async function getLatestNudgeForPartner(
  coupleId: string,
  fromUid: string,
  toUid: string
): Promise<Nudge | null> {
  const snap = await getDocs(
    query(
      nudgesCol(coupleId),
      where('fromUid', '==', fromUid),
      where('toUid', '==', toUid),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
  );
  const first = snap.docs[0];
  return first ? ({ ...(first.data() as Omit<Nudge, 'id'>), id: first.id } as Nudge) : null;
}

/**
 * 마지막 발송 이후 남은 쿨다운(ms). 넛지가 없거나 쿨다운이 지났으면 0.
 * createdAt이 아직 서버에서 확정되지 않았으면(null) 쿨다운 없음으로 본다.
 */
export function nudgeCooldownRemainingMs(latest: Nudge | null, nowMs: number): number {
  const createdMs = latest?.createdAt?.toMillis?.();
  if (!createdMs) return 0;
  return Math.max(0, NUDGE_COOLDOWN_MS - (nowMs - createdMs));
}

/**
 * 가계부 입력 요청 넛지를 생성한다. 생성 시 Cloud Function이 파트너에게 FCM 푸시를 보낸다.
 * message는 프리셋 문구 또는 커스텀 한 줄(빈 문자열 허용).
 */
/**
 * 나에게 온 가장 최근의 `pending` 넛지를 실시간으로 구독한다(없으면 null).
 * 대시보드 "받은 콕 찌르기" 카드용 — 푸시가 오지 않는 환경에서도 요청을 앱 안에서 보여준다.
 * 복합 인덱스: nudges (toUid ASC, status ASC, createdAt DESC).
 */
export function subscribeToReceivedNudge(
  coupleId: string,
  toUid: string,
  onChange: (nudge: Nudge | null) => void
): Unsubscribe {
  const q = query(
    nudgesCol(coupleId),
    where('toUid', '==', toUid),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  return onSnapshot(q, (snap) => {
    const first = snap.docs[0];
    onChange(first ? ({ ...(first.data() as Omit<Nudge, 'id'>), id: first.id } as Nudge) : null);
  });
}

/** 받은 넛지에 응답한다(seen / dismissed / done). 규칙상 status·respondedAt만 바꿀 수 있다. */
export async function respondToNudge(
  coupleId: string,
  nudgeId: string,
  status: Exclude<NudgeStatus, 'pending'>
): Promise<void> {
  await updateDoc(doc(nudgesCol(coupleId), nudgeId), {
    status,
    respondedAt: serverTimestamp(),
  });
}

export async function sendNudge(params: {
  coupleId: string;
  fromUid: string;
  toUid: string;
  message: string;
}): Promise<string> {
  const { coupleId, fromUid, toUid, message } = params;
  const ref = await addDoc(nudgesCol(coupleId), {
    coupleId,
    fromUid,
    toUid,
    type: 'record-request',
    message,
    status: 'pending',
    createdAt: serverTimestamp(),
    respondedAt: null,
  });
  return ref.id;
}
