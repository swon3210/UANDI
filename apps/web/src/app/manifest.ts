import type { MetadataRoute } from 'next';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';
import { loadMessages } from '@/i18n/messages';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // 라우트 핸들러라 next-intl 의 getTranslations 대신 로케일을 직접 정한다(같은 규칙).
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale({
    cookieValue: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get('accept-language'),
  });
  const { metadata } = await loadMessages(locale);

  return {
    name: String(metadata.title),
    short_name: String(metadata.shortName),
    description: String(metadata.description),
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAFAF8',
    theme_color: '#E8837A',
    lang: locale,
    icons: [
      {
        src: '/icons/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
