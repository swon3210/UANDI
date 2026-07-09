import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Nudge } from '@/types';

function nudgesCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/nudges`);
}

/**
 * 파트너에게 보낸 미응답(pending) 넛지가 있으면 반환한다. 없으면 null.
 * 쿨다운(pending 1건) 가드에 사용 — 이미 있으면 새 요청을 보내지 않는다.
 */
export async function getPendingNudgeForPartner(
  coupleId: string,
  fromUid: string,
  toUid: string
): Promise<Nudge | null> {
  const snap = await getDocs(
    query(
      nudgesCol(coupleId),
      where('fromUid', '==', fromUid),
      where('toUid', '==', toUid),
      where('status', '==', 'pending'),
      limit(1)
    )
  );
  const first = snap.docs[0];
  return first ? ({ ...(first.data() as Omit<Nudge, 'id'>), id: first.id } as Nudge) : null;
}

/**
 * 가계부 입력 요청 넛지를 생성한다. 생성 시 Cloud Function이 파트너에게 FCM 푸시를 보낸다.
 * message는 프리셋 문구 또는 커스텀 한 줄(빈 문자열 허용).
 */
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
