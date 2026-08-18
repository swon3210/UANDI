'use client';

import { usePathname } from 'next/navigation';
import { BlogHeader } from './BlogHeader';
import { BlogFooter } from './BlogFooter';

/**
 * /diary(비연결 개인 페이지)는 블로그 헤더·푸터 없이 자기만의 화면을 쓴다.
 * 블로그 어디에도 링크가 없어야 하므로 내비게이션 자체를 그리지 않는다.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/diary' || pathname.startsWith('/diary/')) {
    return <div className="flex-1">{children}</div>;
  }

  return (
    <>
      <BlogHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
      <BlogFooter />
    </>
  );
}
