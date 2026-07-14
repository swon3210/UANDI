import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { CouplePresenceDoc } from '@/types';

// 커플당 단일 요약 문서. uid를 키로 각 멤버의 { lastSeen, message, messageUpdatedAt }를 보관한다.
// 전체 스캔 없이 문서 1개만 구독/갱신한다. (couples/{coupleId}/meta/presence)
function presenceDocRef(coupleId: string) {
  return doc(getDb(), 'couples', coupleId, 'meta', 'presence');
}

/**
 * 하트비트 — 내 lastSeen만 갱신한다. `merge: true`는 맵을 재귀 병합하므로
 * 기존 message는 보존되고, 문서/필드가 없으면 새로 만든다.
 */
export async function touchPresence(coupleId: string, uid: string): Promise<void> {
  await setDoc(
    presenceDocRef(coupleId),
    { [uid]: { lastSeen: serverTimestamp() } },
    { merge: true }
  );
}

/**
 * 내 한마디를 저장한다(message + messageUpdatedAt). lastSeen은 병합으로 보존된다.
 */
export async function setMyCoupleMessage(
  coupleId: string,
  uid: string,
  message: string
): Promise<void> {
  await setDoc(
    presenceDocRef(coupleId),
    { [uid]: { message, messageUpdatedAt: serverTimestamp() } },
    { merge: true }
  );
}

/**
 * 커플 presence 문서 실시간 구독. 문서가 없으면 빈 객체로 통지한다.
 */
export function subscribeToCouplePresence(
  coupleId: string,
  onChange: (presence: CouplePresenceDoc) => void
): Unsubscribe {
  return onSnapshot(presenceDocRef(coupleId), (snap) => {
    onChange(snap.exists() ? ((snap.data() as CouplePresenceDoc) ?? {}) : {});
  });
}
