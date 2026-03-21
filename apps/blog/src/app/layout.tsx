import type { Metadata } from 'next';
import { BlogHeader } from '@/components/BlogHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'UANDI Dev Blog',
  description: 'UANDI 서비스를 만들어가는 과정을 기록합니다.',
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
      <body className="min-h-screen bg-white font-sans antialiased">
        <BlogHeader />
        <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
