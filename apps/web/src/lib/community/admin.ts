import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';

const ADMINS = 'admins';

/**
 * 클라이언트가 자기 uid의 admin 문서를 읽어 본인이 admin인지 판정.
 * 보안 규칙: read는 본인 uid만 허용 — 즉 가드용이지 보안 경계가 아니다.
 * 모더레이션 액션의 권한 검증은 항상 서버(`/api/community/moderate`)에서 한다.
 */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(getDb(), ADMINS, uid));
    return snap.exists();
  } catch {
    return false;
  }
}
