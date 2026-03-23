import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

type AuthResult = {
  uid: string;
  coupleId: string;
};

/**
 * API Route에서 Firebase Auth 토큰을 검증하고 coupleId를 반환한다.
 * 실패 시 적절한 에러 NextResponse를 반환한다.
 */
export async function verifyAuth(
  req: NextRequest
): Promise<AuthResult | NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    // Firestore에서 coupleId 조회
    const userDoc = await adminDb().collection('users').doc(uid).get();
    const coupleId = userDoc.data()?.coupleId as string | undefined;

    if (!coupleId) {
      return NextResponse.json(
        { error: '커플 연결이 필요합니다' },
        { status: 403 }
      );
    }

    return { uid, coupleId };
  } catch {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
  }
}
