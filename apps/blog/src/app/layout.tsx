import type { Metadata } from 'next';
import { BlogHeader } from '@/components/BlogHeader';
import { BlogFooter } from '@/components/BlogFooter';
import './globals.css';

// 기본값은 실제 서비스 중인 도메인이어야 한다 — 죽은 도메인이 기본이면
// og:image·RSS 등 절대 URL이 전부 접속 불가가 된다. 커스텀 도메인을 붙이면
// Vercel에 SITE_URL 환경변수로 덮어쓸 것.
const siteUrl = process.env.SITE_URL ?? 'https://uandi-blog.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Doggae Log',
  description:
    '만드는 데서 멈추지 않고 현장에서 쓰이게 만드는 일 — AI를 팀과 제품에 배치해 정착시켜 온 과정을 기록합니다.',
  openGraph: {
    siteName: 'Doggae Log',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-white font-sans antialiased">
        <BlogHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          {children}
        </main>
        <BlogFooter />
      </body>
    </html>
  );
}
