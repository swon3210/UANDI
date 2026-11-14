import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Couple, User } from '@/types';

/**
 * 짝꿍 문서를 못 읽을 때(상대 users.coupleId가 어긋나 규칙에 걸리는 등) 쓰는 자리표시.
 * memberUids에 있는 사람은 화면에서 "짝꿍"으로라도 보여야 하므로 목록에서 빼지 않는다.
 * displayName이 비어 있어 표시 측은 기본 이름('짝꿍' 등)으로 대체한다.
 */
function unreadableMember(uid: string, coupleId: string, couple: Couple): User {
  return { uid, email: '', displayName: '', photoURL: null, coupleId, createdAt: couple.createdAt };
}

async function getCoupleMembers(coupleId: string): Promise<User[]> {
  const coupleSnap = await getDoc(doc(getDb(), 'couples', coupleId));
  if (!coupleSnap.exists()) return [];

  const couple = coupleSnap.data() as Couple;
  // 한 명을 못 읽어도 전체가 실패하지 않게 멤버별로 따로 처리한다
  const members = await Promise.all(
    couple.memberUids.map(async (uid) => {
      try {
        const userSnap = await getDoc(doc(getDb(), 'users', uid));
        return userSnap.exists()
          ? (userSnap.data() as User)
          : unreadableMember(uid, coupleId, couple);
      } catch (e) {
        console.error('[useCoupleMembers] 멤버 문서 읽기 실패:', uid, e);
        return unreadableMember(uid, coupleId, couple);
      }
    })
  );

  return members;
}

export function useCoupleMembers(coupleId: string | null) {
  return useQuery({
    queryKey: ['coupleMembers', coupleId],
    queryFn: () => getCoupleMembers(coupleId!),
    enabled: !!coupleId,
    staleTime: 5 * 60 * 1000, // 멤버 정보는 자주 변하지 않음
  });
}

/** uid → User 매핑을 반환. 작성자 이름/사진 표시 등 uid를 멤버 정보로 변환할 때 사용. */
export function useCoupleMemberMap(coupleId: string | null) {
  const { data: members } = useCoupleMembers(coupleId);

  return useMemo(() => {
    const map = new Map<string, User>();
    members?.forEach((m) => map.set(m.uid, m));
    return map;
  }, [members]);
}

/** uid → photoURL 매핑을 반환 */
export function useUploaderAvatars(coupleId: string | null) {
  const { data: members } = useCoupleMembers(coupleId);

  if (!members) return undefined;

  const avatars: Record<string, string | null> = {};
  members.forEach((m) => {
    avatars[m.uid] = m.photoURL;
  });
  return avatars;
}
