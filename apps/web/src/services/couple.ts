import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Couple } from '@/types';
import { updateUserDocument } from './user';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createCouple(uid: string): Promise<{ coupleId: string; inviteCode: string }> {
  const coupleRef = doc(collection(getDb(), 'couples'));
  const coupleId = coupleRef.id;

  // 중복 없는 초대 코드 생성
  let inviteCode = '';
  for (let i = 0; i < 5; i++) {
    const candidate = generateInviteCode();
    const snap = await getDocs(
      query(collection(getDb(), 'couples'), where('inviteCode', '==', candidate))
    );
    if (snap.empty) {
      inviteCode = candidate;
      break;
    }
  }
  if (!inviteCode) inviteCode = generateInviteCode();

  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000));

  await setDoc(coupleRef, {
    id: coupleId,
    memberUids: [uid],
    inviteCode,
    inviteCodeExpiresAt: expiresAt,
    createdAt: serverTimestamp(),
  });

  await updateUserDocument(uid, { coupleId });

  return { coupleId, inviteCode };
}

export async function joinCoupleByInviteCode(uid: string, code: string): Promise<void> {
  const snap = await getDocs(
    query(collection(getDb(), 'couples'), where('inviteCode', '==', code.toUpperCase()))
  );

  if (snap.empty) throw new Error('INVITE_CODE_NOT_FOUND');

  const coupleDoc = snap.docs[0]!;
  const couple = coupleDoc.data() as Couple;
  const now = Timestamp.now();

  if (couple.inviteCodeExpiresAt.toMillis() < now.toMillis()) {
    throw new Error('INVITE_CODE_EXPIRED');
  }

  if (couple.memberUids.length >= 2) {
    throw new Error('COUPLE_ALREADY_FULL');
  }

  if (couple.memberUids.includes(uid)) {
    throw new Error('CANNOT_JOIN_OWN_COUPLE');
  }

  await updateDoc(doc(getDb(), 'couples', coupleDoc.id), {
    memberUids: arrayUnion(uid),
  });

  await updateUserDocument(uid, { coupleId: coupleDoc.id });
}

export function subscribeToCouple(
  coupleId: string,
  onChange: (couple: Couple) => void
): Unsubscribe {
  return onSnapshot(doc(getDb(), 'couples', coupleId), (snap) => {
    if (snap.exists()) onChange(snap.data() as Couple);
  });
}
