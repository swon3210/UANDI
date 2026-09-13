import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WriteEditor, type DraftSnapshot } from '@/components/write/WriteEditor';
import { NEW_DRAFT_KEY, WRITE_ENABLED, listPosts, readDraftSnapshot } from '@/lib/write';

// 파일명이 *.dev.tsx인 이유는 next.config.ts 주석 참고 —
// 프로덕션 빌드에서는 pageExtensions에서 빠져 라우트 자체가 만들어지지 않는다.
export const metadata: Metadata = {
  title: '글쓰기 | Doggae Log',
  robots: { index: false, follow: false },
};

// 매번 content/posts/와 임시저장본을 다시 읽는다.
export const dynamic = 'force-dynamic';

export default function WritePage() {
  if (!WRITE_ENABLED) notFound();

  return (
    <WriteEditor
      initialPosts={listPosts()}
      initialDraft={readDraftSnapshot(NEW_DRAFT_KEY) as DraftSnapshot | null}
    />
  );
}
