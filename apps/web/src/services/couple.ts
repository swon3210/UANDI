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
import { initDefaultCategories } from './cashbook-categories';

/** 초대 코드 유효 기간 — 생성 후 48시간 */
export const INVITE_CODE_TTL_MS = 48 * 60 * 60 * 1000;

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

/** 코드가 아직 쓸 수 있는 상태인지 (만료 전 + 미소진) */
function isInviteCodeActive(inviteCode: InviteCode): boolean {
  return inviteCode.consumedBy === null && inviteCode.expiresAt.toMillis() > Date.now();
}

/**
 * 새 초대 코드를 발급해 inviteCodes/{code}에 기록하고 couple.inviteCode를 갱신한다.
 * createdByName은 합류 전 상대에게 "OO님의 초대예요"를 보여주기 위한 비정규화 값.
 */
async function issueInviteCode(
  coupleId: string,
  uid: string,
  displayName: string
): Promise<string> {
  const inviteCode = await generateUniqueInviteCode();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + INVITE_CODE_TTL_MS));

  await setDoc(doc(getDb(), 'inviteCodes', inviteCode), {
    code: inviteCode,
    coupleId,
    createdBy: uid,
    createdByName: displayName,
    expiresAt,
    consumedBy: null,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(getDb(), 'couples', coupleId), { inviteCode });

  return inviteCode;
}

export async function createCouple(
  uid: string,
  displayName: string
): Promise<{ coupleId: string; inviteCode: string }> {
  const coupleRef = doc(collection(getDb(), 'couples'));
  const coupleId = coupleRef.id;

  await setDoc(coupleRef, {
    id: coupleId,
    memberUids: [uid],
    createdAt: serverTimestamp(),
  });

  // 신규 커플이 카테고리 0개로 시작하지 않도록 기본 카테고리(3축 분류)를 먼저 깔아 둔다
  await initDefaultCategories(coupleId);

  const inviteCode = await issueInviteCode(coupleId, uid, displayName);

  await updateUserDocument(uid, { coupleId });

  return { coupleId, inviteCode };
}

/**
 * 커플의 현재 초대 코드를 돌려준다. couple.inviteCode가 아직 유효하면 그대로,
 * 없거나(구버전) 만료·소진됐으면 새로 발급한다. 대시보드 초대 시트가 사용.
 */
export async function ensureActiveInviteCode(
  coupleId: string,
  uid: string,
  displayName: string
): Promise<string> {
  const coupleSnap = await getDoc(doc(getDb(), 'couples', coupleId));
  const current = coupleSnap.exists() ? (coupleSnap.data() as Couple).inviteCode : undefined;

  if (current) {
    const codeSnap = await getDoc(doc(getDb(), 'inviteCodes', current));
    if (codeSnap.exists() && isInviteCodeActive(codeSnap.data() as InviteCode)) return current;
  }

  return issueInviteCode(coupleId, uid, displayName);
}

export type InviteCodePreview = {
  /** 생성자 표시 이름. 구버전 코드엔 없다 */
  inviterName: string | null;
};

/**
 * 합류 전 미리보기 — 코드가 유효하면 초대한 사람 이름을, 없음·만료·만석·내 코드면 null을 돌려준다.
 * 거절 사유는 알려주지 않는다(연결하기 때 joinCoupleByInviteCode의 에러로 전달).
 */
export async function previewInviteCode(
  code: string,
  uid: string
): Promise<InviteCodePreview | null> {
  const normalized = code.toUpperCase();
  const codeSnap = await getDoc(doc(getDb(), 'inviteCodes', normalized));
  if (!codeSnap.exists()) return null;

  const inviteCode = codeSnap.data() as InviteCode;
  if (!isInviteCodeActive(inviteCode) || inviteCode.createdBy === uid) return null;

  return { inviterName: inviteCode.createdByName?.trim() || null };
}

export async function joinCoupleByInviteCode(
  uid: string,
  code: string
): Promise<{ coupleId: string; partnerUid: string }> {
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

  return { coupleId: inviteCode.coupleId, partnerUid: inviteCode.createdBy };
}

export function subscribeToCouple(
  coupleId: string,
  onChange: (couple: Couple) => void
): Unsubscribe {
  return onSnapshot(doc(getDb(), 'couples', coupleId), (snap) => {
    if (snap.exists()) onChange(snap.data() as Couple);
  });
}

/** 초대 링크 — `/invite/{code}`. 링크로 들어오면 로그인 뒤 코드 입력 화면이 바로 열린다. */
export function buildInviteLink(code: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/invite/${code.toUpperCase()}`;
}
