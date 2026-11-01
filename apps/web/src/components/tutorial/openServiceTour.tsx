'use client';

import { overlay } from 'overlay-kit';
import { Dialog } from '@uandi/ui';
import { ServiceTourOverlay } from './ServiceTourOverlay';
import type { TourContext } from './tourSlides';

/** 빠른 추가 시트를 여는 전역 이벤트 (CashbookFab·QuickAddBridge와 동일) */
const QUICK_ADD_EVENT = 'uandi:quick-add';

/**
 * 온보딩 투어를 연다. 첫 진입 자동 노출(useCashbookEntryAutoOpen)과
 * 프로필 메뉴 "튜토리얼 다시 보기"가 모두 이 함수를 호출해 로직을 공유한다.
 * 마지막 장 "첫 내역 적기"는 투어를 닫은 뒤 빠른 추가 시트를 연다.
 */
export function openServiceTour(context: TourContext = { partnerName: null }) {
  overlay.open(({ isOpen, close, unmount }) => {
    const dismiss = () => {
      close();
      setTimeout(unmount, 300);
    };
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <ServiceTourOverlay
          context={context}
          onClose={dismiss}
          onFirstEntry={() => {
            dismiss();
            // 다이얼로그가 닫힌 뒤 시트가 열리도록 한 틱 미룬다
            setTimeout(() => window.dispatchEvent(new Event(QUICK_ADD_EVENT)), 350);
          }}
        />
      </Dialog>
    );
  });
}
