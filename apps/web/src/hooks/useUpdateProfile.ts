import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { userAtom } from '@/stores/auth.store';
import { updateUserDocument } from '@/services/user';
import { useAuth } from '@/hooks/useAuth';

type ProfileUpdate = {
  displayName?: string;
  photoURL?: string | null;
};

/**
 * 프로필(이름/사진)을 users/{uid} 문서에 저장한다. Firestore 단일 소스.
 * 성공 시 userAtom을 즉시 갱신(헤더/설정 반영)하고, 커플 멤버/프로필 캐시를 무효화한다.
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const coupleId = user?.coupleId ?? null;
  const setUser = useSetAtom(userAtom);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      if (!uid) throw new Error('로그인이 필요합니다.');
      await updateUserDocument(uid, data);
      return data;
    },
    onSuccess: (data) => {
      // userAtom을 읽는 UI(ProfileMenu, 설정 화면 등)에 즉시 반영
      setUser((prev) => (prev ? { ...prev, ...data } : prev));
      // 본인 화면은 즉시 재조회, 파트너는 다음 조회 시 반영(staleTime 5분)
      qc.invalidateQueries({ queryKey: ['coupleMembers', coupleId] });
      qc.invalidateQueries({ queryKey: ['userProfile', uid] });
      toast.success('프로필을 저장했어요.');
    },
    onError: () => {
      toast.error('프로필 저장에 실패했어요. 다시 시도해주세요.');
    },
  });
}
