import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UANDI',
  description: '신혼부부를 위한 프라이빗 라이프 매니지먼트 앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-stone-50 text-stone-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
