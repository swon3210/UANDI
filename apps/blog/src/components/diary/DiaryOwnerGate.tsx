'use client';

import { useDiaryAuth } from '@/hooks/useDiaryAuth';

/** 주인 계정으로 로그인했을 때만 children을 그린다. 실제 차단은 Firestore 규칙이 한다. */
export function DiaryOwnerGate({ children }: { children: (ownerUid: string) => React.ReactNode }) {
  const { auth, signIn, signOut } = useDiaryAuth();

  if (auth.status === 'owner') return <>{children(auth.uid)}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      {auth.status === 'loading' ? (
        <p className="text-sm text-gray-400">확인 중…</p>
      ) : auth.status === 'unconfigured' ? (
        <p className="text-sm text-gray-500">
          블로그 앱에 <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_FIREBASE_*</code>{' '}
          환경변수가 없습니다.
        </p>
      ) : auth.status === 'stranger' ? (
        <>
          <p className="font-serif text-lg text-gray-900">글을 쓸 수 있는 계정이 아닙니다.</p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            다른 계정으로 로그인
          </button>
        </>
      ) : (
        <>
          <p className="font-serif text-lg text-gray-900">로그인이 필요합니다.</p>
          <button
            type="button"
            onClick={() => void signIn()}
            className="mt-6 rounded-full bg-gray-900 px-5 py-2 text-sm text-white transition-colors hover:bg-black"
          >
            Google로 로그인
          </button>
        </>
      )}
    </div>
  );
}
