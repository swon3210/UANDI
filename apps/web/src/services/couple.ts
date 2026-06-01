import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Couple, InviteCode } from '@/types';
import { updateUserDocument } from './user';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// 충돌 없는 코드 생성: inviteCodes/{code} 문서를 직접 get으로 확인 (list 쿼리 X)
async function generateUniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateInviteCode();
    const snap = await getDoc(doc(getDb(), 'inviteCodes', candidate));
    if (!snap.exists()) return candidate;
  }
  // 5번 충돌은 36^6 ≈ 2.18B 코드 공간에서 사실상 불가능. 안전망으로 마지막 시도분 반환.
  return generateInviteCode();
}

export async function createCouple(uid: string): Promise<{ coupleId: string; inviteCode: string }> {
  const coupleRef = doc(collection(getDb(), 'couples'));
  const coupleId = coupleRef.id;

  const inviteCode = await generateUniqueInviteCode();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000));

  await setDoc(coupleRef, {
    id: coupleId,
    memberUids: [uid],
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(getDb(), 'inviteCodes', inviteCode), {
    code: inviteCode,
    coupleId,
    createdBy: uid,
    expiresAt,
    consumedBy: null,
    createdAt: serverTimestamp(),
  });

  await updateUserDocument(uid, { coupleId });

  return { coupleId, inviteCode };
}

export async function joinCoupleByInviteCode(uid: string, code: string): Promise<void> {
  const normalized = code.toUpperCase();
  const codeRef = doc(getDb(), 'inviteCodes', normalized);
  const codeSnap = await getDoc(codeRef);

  if (!codeSnap.exists()) throw new Error('INVITE_CODE_NOT_FOUND');

  const inviteCode = codeSnap.data() as InviteCode;
  const now = Timestamp.now();

  if (inviteCode.expiresAt.toMillis() < now.toMillis()) {
    throw new Error('INVITE_CODE_EXPIRED');
  }

  if (inviteCode.createdBy === uid) {
    throw new Error('CANNOT_JOIN_OWN_COUPLE');
  }

  if (inviteCode.consumedBy !== null) {
    throw new Error('COUPLE_ALREADY_FULL');
  }

  // 1) consumedBy 선점 — 동시 합류 경합 시 두 번째 호출은 rule에서 거절됨
  await updateDoc(codeRef, { consumedBy: uid });

  // 2) couple의 memberUids에 본인 추가 (rule: size 1→2, self-add only)
  await updateDoc(doc(getDb(), 'couples', inviteCode.coupleId), {
    memberUids: arrayUnion(uid),
  });

  // 3) user 문서에 coupleId 기록
  await updateUserDocument(uid, { coupleId: inviteCode.coupleId });
}

export function subscribeToCouple(
  coupleId: string,
  onChange: (couple: Couple) => void
): Unsubscribe {
  return onSnapshot(doc(getDb(), 'couples', coupleId), (snap) => {
    if (snap.exists()) onChange(snap.data() as Couple);
  });
}
