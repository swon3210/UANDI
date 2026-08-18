import type { Metadata } from 'next';
import { DiaryWriteView } from '@/components/diary/DiaryWriteView';

export const metadata: Metadata = {
  title: '새 일기',
  robots: { index: false, follow: false },
};

export default function DiaryWritePage() {
  return <DiaryWriteView />;
}
