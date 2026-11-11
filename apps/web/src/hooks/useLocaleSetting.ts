'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAtom } from 'jotai';
import { isLocale, setLocaleCookie, DEFAULT_LOCALE, type Locale } from '@/lib/locale';
import { updateUserDocument } from '@/services/user';
import { userAtom } from '@/stores/auth.store';

/**
 * 표시 언어 읽기/변경.
 * 변경 시 쿠키(uandi-locale) → users/{uid}.locale(로그인 시, best-effort) → router.refresh() 순으로 반영한다.
 * refresh 가 서버 컴포넌트(메시지·<html lang>)를 다시 그리므로 전체 새로고침은 필요 없다.
 */
export function useLocaleSetting() {
  const current = useLocale();
  const locale: Locale = isLocale(current) ? current : DEFAULT_LOCALE;
  const router = useRouter();
  const [user, setUser] = useAtom(userAtom);
  const [isPending, startTransition] = useTransition();

  const setLocale = (next: Locale) => {
    if (next === locale) return;
    setLocaleCookie(next);
    if (user) {
      setUser({ ...user, locale: next });
      updateUserDocument(user.uid, { locale: next }).catch((e) => {
        console.error('[useLocaleSetting] users.locale 저장 실패:', e);
      });
    }
    startTransition(() => router.refresh());
  };

  return { locale, setLocale, isPending };
}
