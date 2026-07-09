import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

// 영구 무효 토큰 코드 — 앱 삭제/재설치, 브라우저 구독 해제, 로그아웃 등으로 더 이상 도달 불가.
// 이 코드로 실패한 토큰은 users/{uid}/fcmTokens에서 즉시 정리한다.
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

export type TokenDoc = {
  ref: admin.firestore.DocumentReference;
  token: string;
};

/** users/{uid}/fcmTokens 문서를 ref와 함께 로드한다(정리 삭제에 ref가 필요). */
export async function loadUserTokenDocs(
  db: admin.firestore.Firestore,
  uid: string
): Promise<TokenDoc[]> {
  const snap = await db.collection(`users/${uid}/fcmTokens`).get();
  return snap.docs
    .map((d) => ({ ref: d.ref, token: d.data().token as string | undefined }))
    .filter((t): t is TokenDoc => Boolean(t.token));
}

/**
 * 멀티캐스트로 발송한 뒤 무효 토큰(등록 해제된 앱/브라우저)을 Firestore에서 정리한다.
 * 죽은 토큰이 쌓여 발송 실패가 누적되는 것을 방지한다. 반환값은 admin BatchResponse.
 */
export async function sendAndPrune(
  messaging: admin.messaging.Messaging,
  tokenDocs: TokenDoc[],
  message: Omit<admin.messaging.MulticastMessage, 'tokens'>
): Promise<admin.messaging.BatchResponse | null> {
  if (tokenDocs.length === 0) return null;

  const res = await messaging.sendEachForMulticast({
    ...message,
    tokens: tokenDocs.map((t) => t.token),
  });

  const stale: admin.firestore.DocumentReference[] = [];
  res.responses.forEach((r, i) => {
    const code = r.error?.code;
    if (!r.success && code && INVALID_TOKEN_CODES.has(code)) {
      stale.push(tokenDocs[i].ref);
    }
  });

  if (stale.length > 0) {
    await Promise.all(
      stale.map((ref) => ref.delete().catch((err) => logger.warn('prune token failed', { err })))
    );
    logger.info('pruned stale FCM tokens', { count: stale.length });
  }

  return res;
}
