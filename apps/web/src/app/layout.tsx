import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Providers } from './providers';
import { LocaleSync } from '@/components/LocaleSync';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E8837A',
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('title'),
    description: t('description'),
    applicationName: t('title'),
    appleWebApp: {
      capable: true,
      title: t('title'),
      statusBarStyle: 'default',
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: '/icons/favicon.svg', type: 'image/svg+xml' },
        { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon-180.png', sizes: '180x180' }],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 로케일은 요청마다 src/i18n/request.ts 가 쿠키/Accept-Language 로 정한다(URL prefix 없음).
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale}>
      <body className="bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleSync locale={locale} />
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
