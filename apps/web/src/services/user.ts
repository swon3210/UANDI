import dayjs from 'dayjs';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { FcmTokenPlatform, User } from '@/types';

export async function getUserDocument(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(getDb(), 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

/**
 * users/{uid} 문서가 없을 때만 만든다. 이미 있으면 덮어쓰지 않고 기존 문서를 돌려준다.
 * 트랜잭션은 서버에 닿아야 커밋되므로, 오프라인에서 기존 문서(coupleId 등)를
 * 빈 값으로 덮어쓰는 일이 없다. (2026-11 커플 연결 끊김 사고 재발 방지)
 */
export async function createUserDocumentIfAbsent(
  uid: string,
  data: Omit<User, 'uid' | 'createdAt'>
): Promise<{ user: User; created: boolean }> {
  const ref = doc(getDb(), 'users', uid);
  return runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) return { user: snap.data() as User, created: false };
    tx.set(ref, { uid, ...data, createdAt: serverTimestamp() });
    return { user: { uid, ...data, createdAt: Timestamp.now() }, created: true };
  });
}

/**
 * 내 users 문서를 읽되, 실패하면(오프라인 등) 잠시 뒤 다시 시도한다.
 * 끝내 실패하면 에러를 그대로 던진다 — "문서 없음(null)"과 구분해야
 * 호출 측이 실패를 신규 가입으로 착각해 문서를 새로 만들지 않는다.
 */
export async function getOwnUserDocumentWithRetry(
  uid: string,
  { attempts = 3, delayMs = 1000 }: { attempts?: number; delayMs?: number } = {}
): Promise<User | null> {
  for (let i = 0; ; i++) {
    try {
      return await getUserDocument(uid);
    } catch (e) {
      if (i >= attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
}

export async function updateUserDocument(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(getDb(), 'users', uid), data);
}

/**
 * 앱을 연 플랫폼의 마지막 사용 시각을 users/{uid}.clientPlatforms 에 남긴다(어드민 사용자 현황용).
 * 같은 기기·플랫폼에서는 하루 한 번만 쓴다. 실패해도 앱 사용에는 영향이 없다(best-effort).
 */
export async function recordClientPlatform(uid: string, platform: FcmTokenPlatform): Promise<void> {
  const key = `uandi:client-platform:${uid}:${platform}`;
  const today = dayjs().format('YYYY-MM-DD');
  try {
    if (window.localStorage.getItem(key) === today) return;
  } catch {
    // 저장소 접근 불가(사생활 보호 모드 등) — 매번 쓰더라도 진행
  }
  await updateDoc(doc(getDb(), 'users', uid), {
    [`clientPlatforms.${platform}`]: serverTimestamp(),
  });
  try {
    window.localStorage.setItem(key, today);
  } catch {
    // 무시
  }
}

/**
 * 짝꿍 문서를 읽되, 권한이 아직 안 열렸으면 잠시 뒤 다시 시도한다.
 * 합류 직후엔 상대 users/{uid}.coupleId 반영이 memberUids보다 한 박자 늦어
 * 커플 멤버 읽기 규칙에 걸릴 수 있다. 끝내 못 읽으면 null.
 */
export async function getUserDocumentWithRetry(
  uid: string,
  { attempts = 4, delayMs = 500 }: { attempts?: number; delayMs?: number } = {}
): Promise<User | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const user = await getUserDocument(uid);
      if (user) return user;
    } catch {
      // permission-denied 등 — 아래에서 대기 후 재시도
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}
