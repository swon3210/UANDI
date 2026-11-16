'use client';

import { overlay } from 'overlay-kit';
import { Sheet } from '@uandi/ui';
import type { Announcement } from '@/content/announcements';
import { AnnouncementSheet } from './AnnouncementSheet';

export const ANNOUNCEMENTS_PATH = '/announcements';

type OpenAnnouncementSheetOptions = {
  /** 안 읽은 공지(최신순) */
  announcements: Announcement[];
  /** 바로 가기·모두 보기 — 시트를 닫은 뒤 호출(라우팅은 호출 측) */
  onNavigate: (href: string) => void;
};

/** 대시보드 공지 시트를 연다(docs/pages/09-announcements.md). */
export function openAnnouncementSheet({ announcements, onNavigate }: OpenAnnouncementSheetOptions) {
  overlay.open(({ isOpen, close, unmount }) => {
    const dismiss = () => {
      close();
      setTimeout(unmount, 300);
    };
    const navigate = (href: string) => {
      dismiss();
      onNavigate(href);
    };
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && dismiss()}>
        <AnnouncementSheet
          announcements={announcements}
          onConfirm={dismiss}
          onLinkClick={navigate}
          onSeeAll={() => navigate(ANNOUNCEMENTS_PATH)}
        />
      </Sheet>
    );
  });
}
