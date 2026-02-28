import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

// Firebase Auth는 클라이언트 전용이므로 정적 생성 비활성화
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'UANDI',
  description: '우리 둘만의 공간',
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
