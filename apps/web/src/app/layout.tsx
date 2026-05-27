import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E8837A',
};

export const metadata: Metadata = {
  title: 'UANDI',
  description: '함께 모으는 우리집, 각자 운영하는 재테크까지 — 둘이서 만드는 살림 공간',
  applicationName: 'UANDI',
  appleWebApp: {
    capable: true,
    title: 'UANDI',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
