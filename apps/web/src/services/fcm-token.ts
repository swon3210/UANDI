import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';

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
  userAgent: string
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
      createdAt: serverTimestamp(),
      lastUsedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
