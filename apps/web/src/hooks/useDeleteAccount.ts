import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { userAtom } from '@/stores/auth.store';
import { deleteAccount } from '@/services/account';

export function useDeleteAccount() {
  const setUser = useSetAtom(userAtom);
  const router = useRouter();

  return useMutation({
    mutationFn: ({ uid, coupleId }: { uid: string; coupleId: string | null }) =>
      deleteAccount(uid, coupleId),
    onSuccess: () => {
      setUser(null);
      router.replace('/');
    },
    onError: () => {
      toast.error('회원탈퇴에 실패했습니다. 다시 시도해 주세요.');
    },
  });
}
