import { useQuery } from '@tanstack/react-query';
import { getUserDocument } from '@/services/user';

export function useUserProfile(uid: string | null) {
  return useQuery({
    queryKey: ['userProfile', uid],
    queryFn: () => getUserDocument(uid!),
    enabled: !!uid,
  });
}
