import type { Metadata } from 'next';
import { DiaryEntryView } from '@/components/diary/DiaryEntryView';

// 제목을 메타데이터에 싣지 않는다 — 링크가 어딘가에 새더라도 미리보기로 내용이 퍼지지 않게.
export const metadata: Metadata = {
  title: '일기',
  robots: { index: false, follow: false },
};

export default async function DiaryEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DiaryEntryView entryId={id} />;
}
