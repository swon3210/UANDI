import { updateDoc, deleteDoc, doc, arrayRemove } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { deleteCurrentUser } from '@/lib/firebase/auth';
import { setAuthCookie } from '@/lib/auth-cookie';

export async function deleteAccount(uid: string, coupleId: string | null): Promise<void> {
  const db = getDb();

  // 1. 커플 멤버 목록에서 제거
  if (coupleId) {
    await updateDoc(doc(db, 'couples', coupleId), {
      memberUids: arrayRemove(uid),
    });
  }

  // 2. Firestore 유저 문서 삭제
  await deleteDoc(doc(db, 'users', uid));

  // 3. Firebase Auth 계정 삭제
  await deleteCurrentUser();

  // 4. 인증 쿠키 초기화
  setAuthCookie(null);
}
