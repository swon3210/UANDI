import dayjs from 'dayjs';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { FcmTokenPlatform, User } from '@/types';

export async function getUserDocument(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(getDb(), 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export async function createUserDocument(
  uid: string,
  data: Omit<User, 'uid' | 'createdAt'>
): Promise<void> {
  await setDoc(doc(getDb(), 'users', uid), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  });
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
