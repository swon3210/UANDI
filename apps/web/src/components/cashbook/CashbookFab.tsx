'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Fab } from '@uandi/ui';
import { isChromelessRoute } from '@/components/shell/chromeless-routes';

/**
 * 가계부 전역 플로팅 추가 버튼.
 * 누르면 전역 QuickAddBridge가 듣는 `uandi:quick-add` 이벤트를 보내
 * "빠른 추가"(AI 파싱 + 수동 입력) 시트를 연다. 추가 진입점을 한 곳으로 통일한다.
 *
 * - 네이티브 앱(웹뷰)에는 자체 플로팅 추가 버튼이 있으므로 웹 FAB는 숨긴다.
 * - 풀스크린(chromeless) 편집 화면(설정·카테고리·위저드 등)에서도 숨긴다.
 */
export function CashbookFab() {
  const pathname = usePathname();
  const [isNative, setIsNative] = useState(false);

  // 네이티브 브리지는 비동기로 주입될 수 있어 `uandi:native-ready`도 함께 구독한다.
  useEffect(() => {
    const check = () => setIsNative(!!window.__UANDI_NATIVE__);
    check();
    window.addEventListener('uandi:native-ready', check);
    return () => window.removeEventListener('uandi:native-ready', check);
  }, []);

  if (isNative || isChromelessRoute(pathname)) return null;

  return (
    <Fab
      icon={<Plus size={24} aria-hidden />}
      label="내역 추가"
      data-testid="cashbook-fab"
      onClick={() => window.dispatchEvent(new Event('uandi:quick-add'))}
    />
  );
}
