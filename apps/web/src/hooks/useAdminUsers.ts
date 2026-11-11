import { useQuery } from '@tanstack/react-query';
import { AdminForbiddenError, fetchAdminUsers } from '@/services/admin';

/** 어드민 사용자 현황. 권한 없음(403)은 재시도하지 않는다. 자동 갱신 없이 화면을 열 때만 조회. */
export function useAdminUsers(uid: string | null) {
  return useQuery({
    queryKey: ['adminUsers', uid],
    queryFn: fetchAdminUsers,
    enabled: !!uid,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (count, error) => !(error instanceof AdminForbiddenError) && count < 2,
  });
}
