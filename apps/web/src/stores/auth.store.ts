// 인증 상태 Jotai atom
// 구현 명세: docs/04-auth-flow.md
//
// userAtom: User | null | undefined
//   - undefined: 초기 로딩 중
//   - null: 비로그인
//   - User: 로그인됨
//
// authStatusAtom: 파생 atom (userAtom으로부터 자동 계산)

import { atom } from 'jotai';
import type { User } from '@/types';

type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'authenticated_no_couple'
  | 'authenticated_with_couple';

// undefined = 로딩 중, null = 비로그인, User = 로그인됨
export const userAtom = atom<User | null | undefined>(undefined);

// userAtom으로부터 파생되는 읽기 전용 상태
export const authStatusAtom = atom<AuthStatus>((get) => {
  const user = get(userAtom);
  if (user === undefined) return 'loading';
  if (user === null) return 'unauthenticated';
  return user.coupleId !== null ? 'authenticated_with_couple' : 'authenticated_no_couple';
});
