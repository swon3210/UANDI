import { signOut as firebaseSignOut } from 'firebase/auth';
import { getAuth } from '@/lib/firebase/config';
import { setAuthCookie } from '@/lib/auth-cookie';

/**
 * 회원탈퇴 — 서버 API(/api/account/delete)가 Admin SDK로 커플 멤버 제거·users 문서·Auth 계정을
 * 순서대로 지운다. 클라이언트 deleteUser()의 재인증(팝업) 요구를 피하기 위해 서버에서 처리한다.
 * 성공하면 로컬 세션을 정리한다(서버에서 이미 지워진 계정이라 signOut 실패는 무시).
 */
export async function deleteAccount(): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('NOT_AUTHENTICATED');

  const token = await user.getIdToken();
  const res = await fetch('/api/account/delete', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`DELETE_ACCOUNT_FAILED_${res.status}`);

  await firebaseSignOut(auth).catch(() => {});
  setAuthCookie(null);
}
