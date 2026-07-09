import { collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteToken, getToken } from 'firebase/messaging';
import { firebaseConfig, getDb, getMessagingIfSupported } from '@/lib/firebase/config';
import type { FcmTokenPlatform } from '@/types';

async function tokenIdFor(token: string): Promise<string> {
  // 동일 토큰은 동일 ID로 매핑하면서, 서로 다른 토큰끼리 충돌하지 않도록 SHA-256 해시를 사용한다.
  const buf = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function upsertFcmToken(
  userId: string,
  token: string,
  userAgent: string,
  platform?: FcmTokenPlatform
): Promise<void> {
  const db = getDb();
  const id = await tokenIdFor(token);
  const ref = doc(collection(db, `users/${userId}/fcmTokens`), id);
  await setDoc(
    ref,
    {
      id,
      userId,
      token,
      userAgent,
      ...(platform ? { platform } : {}),
      createdAt: serverTimestamp(),
      lastUsedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** users/{userId}/fcmTokens/{hash} 문서를 삭제한다. 토큰 문자열로부터 id를 계산해 지운다. */
export async function deleteFcmToken(userId: string, token: string): Promise<void> {
  const db = getDb();
  const id = await tokenIdFor(token);
  await deleteDoc(doc(collection(db, `users/${userId}/fcmTokens`), id));
}

/**
 * 현재 기기의 FCM 토큰을 Firestore에서 제거한다. 로그아웃 시 호출해
 * 로그아웃/재설치 후에도 계속 푸시가 오는 것을 막는다.
 *
 * - 네이티브(WebView) 토큰: window.__UANDI_NATIVE__.fcmToken 문서 삭제.
 * - 웹 푸시 토큰: 현재 브라우저 토큰 문서 삭제 + deleteToken()으로 구독 해제.
 *
 * 모두 best-effort — 실패해도 throw하지 않아 로그아웃 흐름을 막지 않는다.
 */
export async function removeCurrentDeviceTokens(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1) 네이티브(모바일 WebView) 토큰 — 웹 getToken()과 다른 토큰이라 별도로 제거.
  const nativeToken = window.__UANDI_NATIVE__?.fcmToken;
  if (nativeToken) {
    try {
      await deleteFcmToken(userId, nativeToken);
    } catch {
      // best-effort
    }
  }

  // 2) 웹 푸시 토큰 — 브라우저에 등록된 경우에만.
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || !firebaseConfig.projectId) return;
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;

  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging) return;
    const registration = await navigator.serviceWorker.getRegistration('/');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration ?? undefined,
    });
    if (token) await deleteFcmToken(userId, token);
    await deleteToken(messaging);
  } catch {
    // best-effort
  }
}
