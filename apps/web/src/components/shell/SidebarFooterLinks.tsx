import Link from 'next/link';
import { Megaphone, MessageSquareText } from 'lucide-react';

const LINK_CLASS =
  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground';

type SidebarFooterLinksProps = {
  /** 링크를 눌렀을 때(사이드바 닫기) */
  onNavigate?: () => void;
};

/**
 * 사이드바 footer — 서비스와 주고받는 메뉴 묶음.
 * 공지사항(서비스 → 사용자)과 의견 보내기(사용자 → 서비스). 섹션과 달리 iOS 네이티브에서도 보인다.
 * (docs/pages/09-announcements.md, docs/pages/07-feedback.md)
 */
export function SidebarFooterLinks({ onNavigate }: SidebarFooterLinksProps) {
  return (
    <div className="space-y-1">
      <Link
        href="/announcements"
        data-testid="sidebar-announcements-link"
        onClick={onNavigate}
        className={LINK_CLASS}
      >
        <Megaphone size={16} aria-hidden />
        공지사항
      </Link>
      <Link
        href="/settings/feedback"
        data-testid="sidebar-feedback-link"
        onClick={onNavigate}
        className={LINK_CLASS}
      >
        <MessageSquareText size={16} aria-hidden />
        의견 보내기
      </Link>
    </div>
  );
}
