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
  description: '우리 둘만의 공간',
  applicationName: 'UANDI 가계부',
  appleWebApp: {
    capable: true,
    title: 'UANDI 가계부',
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
