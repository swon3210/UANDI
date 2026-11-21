import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminBucket, adminDb } from '@/lib/ai/firebase-admin';

/**
 * 회원탈퇴 — 본인 계정을 서버(Admin SDK)에서 삭제한다. docs/04-auth-flow.md 「회원탈퇴 처리」.
 *
 * 클라이언트 deleteUser()는 로그인이 오래된 계정에 재인증(팝업)을 요구하는데 인앱 WebView에서는
 * 팝업이 열리지 않아 탈퇴가 실패했고, 그 전에 Firestore를 먼저 지워 커플 연결만 끊기는 사고가 있었다.
 * Admin SDK 삭제는 재인증이 필요 없고, 순서를 서버가 책임진다.
 *
 * 순서: 커플 멤버 제거 → users/{uid}(하위 컬렉션 포함) 삭제 → 프로필 사진(best-effort) → Auth 계정 삭제.
 * 중간에 실패해도 다시 호출하면 이어서 처리되도록 각 단계는 멱등이다.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(authHeader.slice(7))).uid;
  } catch {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
  }

  const db = adminDb();
  try {
    // 1. 커플 멤버에서 제거 — users 문서의 coupleId와 memberUids 역조회를 모두 본다
    //    (이전 실패로 users 문서가 먼저 지워진 계정도 커플에서 빠지도록).
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const coupleIds = new Set<string>();
    const coupleId = userSnap.data()?.coupleId;
    if (typeof coupleId === 'string' && coupleId) coupleIds.add(coupleId);
    const memberOf = await db
      .collection('couples')
      .where('memberUids', 'array-contains', uid)
      .get();
    memberOf.docs.forEach((d) => coupleIds.add(d.id));
    for (const id of coupleIds) {
      await db
        .collection('couples')
        .doc(id)
        .update({ memberUids: FieldValue.arrayRemove(uid) })
        .catch(() => {}); // 커플 문서가 없으면 건너뛴다
    }

    // 2. users/{uid} + 하위 컬렉션(fcmTokens 등)
    await db.recursiveDelete(userRef);

    // 3. 프로필 사진 — 실패해도 탈퇴는 진행한다. 에뮬레이터(Storage 미연결)에서는 건너뛴다.
    const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true';
    if (!useEmulator || process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
      await adminBucket()
        .file(`users/${uid}/profile/avatar`)
        .delete({ ignoreNotFound: true })
        .catch((e: unknown) => console.warn('[account/delete] 프로필 사진 삭제 실패:', e));
    }

    // 4. Auth 계정
    await adminAuth()
      .deleteUser(uid)
      .catch((e: { code?: string }) => {
        if (e?.code === 'auth/user-not-found') return;
        throw e;
      });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[account/delete] 회원탈퇴 실패:', e);
    return NextResponse.json({ error: '회원탈퇴 처리에 실패했습니다' }, { status: 500 });
  }
}
