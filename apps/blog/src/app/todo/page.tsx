import type { Metadata } from 'next';
import { TodoView } from '@/components/TodoView';

// 비연결(unlisted) 개인 페이지 — 어떤 내비게이션·RSS·검색·카테고리에도 노출하지 않고,
// 검색 엔진 색인도 막는다. URL을 아는 사람만 직접 진입한다.
export const metadata: Metadata = {
  title: '지금 할 일 | Doggae Log',
  robots: { index: false, follow: false },
};

export default function TodoPage() {
  return <TodoView />;
}
