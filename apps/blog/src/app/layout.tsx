import type { Metadata } from 'next';
import { BlogHeader } from '@/components/BlogHeader';
import { BlogFooter } from '@/components/BlogFooter';
import './globals.css';

const siteUrl = process.env.SITE_URL ?? 'https://blog.uandi.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Doggae Log',
  description: 'MOA 서비스를 만들어가는 과정을 기록합니다.',
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
