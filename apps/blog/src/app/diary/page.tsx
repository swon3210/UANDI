import type { Metadata } from 'next';
import { DiaryListView } from '@/components/diary/DiaryListView';

// 비연결(unlisted) 개인 페이지 — 어떤 내비게이션·RSS·검색·카테고리에도 노출하지 않고,
// 검색 엔진 색인도 막는다. 목록은 주인만, 개별 글은 URL을 아는 사람만 볼 수 있다.
export const metadata: Metadata = {
  title: '일기',
  robots: { index: false, follow: false },
};

export default function DiaryPage() {
  return <DiaryListView />;
}
