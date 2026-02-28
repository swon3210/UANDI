import { useAtomValue } from 'jotai';
import { userAtom, authStatusAtom } from '@/stores/auth.store';

export function useAuth() {
  const user = useAtomValue(userAtom);
  const authStatus = useAtomValue(authStatusAtom);
  return { user, authStatus };
}
