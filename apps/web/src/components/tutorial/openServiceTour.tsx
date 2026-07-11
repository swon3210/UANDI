'use client';

import { overlay } from 'overlay-kit';
import { Dialog } from '@uandi/ui';
import { ServiceTourOverlay } from './ServiceTourOverlay';

/**
 * 말랑 가계부 온보딩 투어를 연다. 첫 진입 자동 노출(useServiceTourAutoOpen)과
 * 프로필 메뉴 "튜토리얼 다시 보기"가 모두 이 함수를 호출해 로직을 공유한다.
 */
export function openServiceTour() {
  overlay.open(({ isOpen, close, unmount }) => (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <ServiceTourOverlay
        onClose={() => {
          close();
          setTimeout(unmount, 300);
        }}
      />
    </Dialog>
  ));
}
