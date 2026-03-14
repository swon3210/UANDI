import { useQuery } from '@tanstack/react-query';
import { getDoc, doc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Couple, User } from '@/types';

async function getCoupleMembers(coupleId: string): Promise<User[]> {
  const coupleSnap = await getDoc(doc(getDb(), 'couples', coupleId));
  if (!coupleSnap.exists()) return [];

  const couple = coupleSnap.data() as Couple;
  const members = await Promise.all(
    couple.memberUids.map(async (uid) => {
      const userSnap = await getDoc(doc(getDb(), 'users', uid));
      return userSnap.exists() ? (userSnap.data() as User) : null;
    })
  );

  return members.filter((m): m is User => m !== null);
}

export function useCoupleMembers(coupleId: string | null) {
  return useQuery({
    queryKey: ['coupleMembers', coupleId],
    queryFn: () => getCoupleMembers(coupleId!),
    enabled: !!coupleId,
    staleTime: 5 * 60 * 1000, // 멤버 정보는 자주 변하지 않음
  });
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
