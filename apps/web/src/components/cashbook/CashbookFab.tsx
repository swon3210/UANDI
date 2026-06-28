'use client';

import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Fab } from '@uandi/ui';
import { isChromelessRoute } from '@/components/shell/chromeless-routes';

/**
 * 가계부 전역 플로팅 추가 버튼.
 * 누르면 전역 QuickAddBridge가 듣는 `uandi:quick-add` 이벤트를 보내
 * "빠른 추가"(AI 파싱 + 수동 입력) 시트를 연다. 추가 진입점을 한 곳으로 통일한다.
 *
 * 네이티브 앱의 플로팅 버블은 앱이 백그라운드일 때만(다른 앱 위에) 뜨고,
 * 포그라운드(웹뷰 화면)에서는 추가 버튼이 없다. 따라서 웹 FAB는 네이티브에서도
 * 노출해야 하며, 백그라운드에서는 웹뷰 자체가 보이지 않아 이중 노출도 생기지 않는다.
 *
 * 풀스크린(chromeless) 편집 화면(설정·카테고리·위저드 등)에서는 숨긴다.
 */
export function CashbookFab() {
  const pathname = usePathname();

  if (isChromelessRoute(pathname)) return null;

  return (
    <Fab
      icon={<Plus size={24} aria-hidden />}
      label="내역 추가"
      data-testid="cashbook-fab"
      onClick={() => window.dispatchEvent(new Event('uandi:quick-add'))}
    />
  );
}
