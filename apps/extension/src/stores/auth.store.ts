import { atom } from 'jotai';

export type ExtensionUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  coupleId: string | null;
};

// undefined = loading, null = unauthenticated, ExtensionUser = authenticated
export const userAtom = atom<ExtensionUser | null | undefined>(undefined);

// Firebase onAuthStateChanged가 최초 응답했는지 여부
export const authReadyAtom = atom(false);

export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'authenticated_no_couple'
  | 'authenticated_with_couple';

export const authStatusAtom = atom<AuthStatus>((get) => {
  const ready = get(authReadyAtom);
  const user = get(userAtom);
  if (!ready) return 'loading';
  if (user === undefined || user === null) return 'unauthenticated';
  if (!user.coupleId) return 'authenticated_no_couple';
  return 'authenticated_with_couple';
});
