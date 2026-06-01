import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/ai/firebase-admin';

/**
 * 모더레이션 API의 보안 경계.
 * Bearer 토큰을 verify해 uid를 얻고, `admins/{uid}` 문서가 존재해야만 통과.
 * 클라이언트 페이지 가드와 별개로 — 서버 진입점에서 이 함수를 통과한 호출만 admin 액션을 수행한다.
 */
export async function verifyAdmin(req: NextRequest): Promise<{ uid: string } | NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
  }

  const adminSnap = await adminDb().collection('admins').doc(uid).get();
  if (!adminSnap.exists) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  return { uid };
}
