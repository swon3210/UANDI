import type { Metadata } from 'next';
import { DiaryEditView } from '@/components/diary/DiaryEditView';

export const metadata: Metadata = {
  title: '일기 수정',
  robots: { index: false, follow: false },
};

export default async function DiaryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DiaryEditView entryId={id} />;
}
