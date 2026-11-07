'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { authStatusAtom } from '@/stores/auth.store';
import { MascotLoader } from '@/components/MascotLoader';
import {
  clearPendingInviteCode,
  normalizeInviteCode,
  savePendingInviteCode,
} from '@/lib/invite-code';

/**
 * 초대 링크 진입점 — /invite/{code}
 * 코드를 기억해 두고 인증 상태에 맞는 곳으로 보낸다. 화면은 로더만 보여준다.
 * - 비로그인 → / (랜딩에 초대 배너)
 * - 커플 없음 → /onboarding (코드가 채워진 입력 화면)
 * - 커플 있음 → / (코드 무시)
 */
export default function InviteLinkPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const authStatus = useAtomValue(authStatusAtom);

  useEffect(() => {
    if (authStatus === 'loading') return;

    const code = normalizeInviteCode(params?.code);
    if (!code) {
      router.replace('/');
      return;
    }

    if (authStatus === 'authenticated_with_couple') {
      clearPendingInviteCode();
      router.replace('/');
      return;
    }

    savePendingInviteCode(code);
    router.replace(authStatus === 'authenticated_no_couple' ? '/onboarding' : '/');
  }, [authStatus, params?.code, router]);

  return <MascotLoader fullScreen />;
}
