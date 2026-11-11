import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/ai/firebase-admin';

/** ADMIN_EMAILS(쉼표 구분)를 소문자 목록으로. 공개 저장소라 이메일은 코드가 아닌 환경변수에 둔다. */
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * 어드민 API의 보안 경계(docs/pages/06-admin.md).
 * Bearer 토큰을 verify해 토큰의 이메일이 ADMIN_EMAILS 에 있고 인증된 이메일일 때만 통과.
 * 커뮤니티 모더레이션의 admins/{uid} 와는 별개다.
 */
export async function verifyAdminEmail(
  req: NextRequest
): Promise<{ uid: string; email: string } | NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  let decoded: Awaited<ReturnType<ReturnType<typeof adminAuth>['verifyIdToken']>>;
  try {
    decoded = await adminAuth().verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
  }

  const email = decoded.email?.toLowerCase();
  // 에뮬레이터의 이메일/비밀번호 테스트 계정은 email_verified 가 false 다
  const verified =
    decoded.email_verified === true || process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true';
  if (!email || !verified || !getAdminEmails().includes(email)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
  }

  return { uid: decoded.uid, email };
}
