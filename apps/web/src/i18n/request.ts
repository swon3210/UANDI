import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';
import { loadMessages } from './messages';

/**
 * next-intl 서버 설정 — URL 라우팅 없이 요청마다 로케일을 정한다.
 * 쿠키(uandi-locale) → Accept-Language → 'ko'. next.config.ts 의 createNextIntlPlugin 이 이 파일을 가리킨다.
 */
export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale({
    cookieValue: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get('accept-language'),
  });

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
