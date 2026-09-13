import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WriteEditor } from '@/components/write/WriteEditor';
import { WRITE_ENABLED, listPosts } from '@/lib/write';

// 파일명이 *.dev.tsx인 이유는 next.config.ts 주석 참고 —
// 프로덕션 빌드에서는 pageExtensions에서 빠져 라우트 자체가 만들어지지 않는다.
export const metadata: Metadata = {
  title: '글쓰기 | Doggae Log',
  robots: { index: false, follow: false },
};

// 매번 content/posts/를 다시 읽어 최신 목록을 보여준다.
export const dynamic = 'force-dynamic';

export default function WritePage() {
  if (!WRITE_ENABLED) notFound();

  return <WriteEditor initialPosts={listPosts()} />;
}
