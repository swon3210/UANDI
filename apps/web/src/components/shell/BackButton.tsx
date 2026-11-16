'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@uandi/ui';
import { hasInAppPrevious, markNextAsRoot } from '@/lib/nav-history';

/** 가계부 서비스의 루트(대시보드). 모든 하위 페이지의 뒤로가기는 결국 여기로 수렴한다. */
export const CASHBOOK_ROOT = '/inner/cashbook';

/**
 * BackButton과 같은 규칙으로 돌아간다 — 앱 안에서 왔으면 router.back(), 아니면 부모 경로로 replace.
 * 제출 완료 후 자동으로 이전 화면으로 돌아갈 때도 쓴다.
 */
export function goBackOrReplace(router: ReturnType<typeof useRouter>, fallbackHref: string) {
  if (hasInAppPrevious()) {
    router.back();
    return;
  }
  markNextAsRoot();
  router.replace(fallbackHref);
}

type BackButtonProps = {
  /**
   * 앱 내 이전 기록이 없을 때(딥링크·알림·새로고침 직후 직접 진입) 이동할 부모 경로.
   * 생략하면 가계부 대시보드로 보낸다.
   */
  fallbackHref?: string;
  /**
   * 앱 내 이동 기록과 상관없이 항상 fallbackHref로 replace 한다.
   * 푸시처럼 트리 밖에서 들어온 화면에서 ←가 보던 화면이 아니라 부모로 가야 할 때 쓴다.
   */
  alwaysFallback?: boolean;
  'data-testid'?: string;
};

/**
 * 헤더 좌측 뒤로가기(←) 버튼. 가계부는 대시보드를 루트로 두고, 거기서 진입한 페이지는
 * 사이드바 토글 대신 이 버튼으로 돌아간다.
 * - 앱 안에서 이동해 왔으면 router.back() — 대시보드의 기간·필터 쿼리를 그대로 복원한다.
 * - 직접 진입이라 앱 안에 돌아갈 곳이 없으면 부모 경로로 replace 한다(앱 밖으로 나가지 않게).
 *   (window.history.length는 앱 밖 기록·새 탭의 about:blank까지 세므로 쓰지 않는다)
 */
export function BackButton({
  fallbackHref = CASHBOOK_ROOT,
  alwaysFallback = false,
  'data-testid': testId = 'header-back',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (alwaysFallback) {
      markNextAsRoot();
      router.replace(fallbackHref);
      return;
    }
    goBackOrReplace(router, fallbackHref);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      aria-label="뒤로 가기"
      data-testid={testId}
      onClick={handleBack}
    >
      <ChevronLeft size={20} />
    </Button>
  );
}
