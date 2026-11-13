import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { userAtom } from '@/stores/auth.store';
import { deleteAccount } from '@/services/account';

export function useDeleteAccount() {
  const t = useTranslations('settings.deleteAccount');
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
      toast.error(t('failed'));
    },
  });
}
