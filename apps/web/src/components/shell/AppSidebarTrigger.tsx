'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { overlay } from 'overlay-kit';
import {
  Menu,
  Home,
  BookOpen,
  Image as ImageIcon,
  Briefcase,
  LayoutDashboard,
  Wallet,
  TrendingUp,
  PiggyBank,
  Users,
  MessageCircle,
} from 'lucide-react';
import {
  AppSidebar,
  Button,
  type SidebarSection,
  type SidebarLinkProps,
  type Space,
} from '@uandi/ui';

/**
 * 사이드바 섹션 구성. 공간(우리집/재테크/커뮤니티)별로 실제 존재하는 목적지만 노출한다.
 * (하단탭을 대체 — docs/08-spaces.md §4 참고)
 */
const SECTIONS: SidebarSection[] = [
  {
    id: 'inner',
    label: '우리집',
    Icon: Home,
    items: [
      { id: 'cashbook', label: '가계부', href: '/inner/cashbook', Icon: BookOpen },
      { id: 'photos', label: '갤러리', href: '/inner/photos', Icon: ImageIcon },
    ],
  },
  {
    id: 'outer',
    label: '재테크',
    Icon: Briefcase,
    items: [
      { id: 'outer-home', label: '홈', href: '/outer', Icon: LayoutDashboard },
      { id: 'forex', label: '환테크', href: '/outer/forex', Icon: Wallet },
      { id: 'investment', label: '투자', href: '/outer/investment', Icon: TrendingUp },
      { id: 'savings', label: '적금', href: '/outer/savings', Icon: PiggyBank },
    ],
  },
  {
    id: 'community',
    label: '커뮤니티',
    Icon: Users,
    items: [{ id: 'community-feed', label: '피드', href: '/community', Icon: MessageCircle }],
  },
];

/** 현재 경로에서 공간 톤(coral/indigo/violet)을 결정. */
function spaceFromPath(pathname: string): Space | undefined {
  if (pathname.startsWith('/outer')) return 'outer';
  if (pathname.startsWith('/community')) return 'community';
  if (pathname.startsWith('/inner')) return 'inner';
  return undefined;
}

// next/link를 AppSidebar의 링크 컴포넌트로 주입 (클라이언트 라우팅 유지)
const SidebarLink = (props: SidebarLinkProps) => <Link {...props} />;

/**
 * 헤더 좌측 햄버거(☰) 버튼. 누르면 좌측 사이드바 드로어를 연다.
 * 항목을 누르거나 바깥을 누르면 닫힌다. (전역 하단탭을 대체하는 네비게이션 진입점)
 */
export function AppSidebarTrigger() {
  const pathname = usePathname();

  const openSidebar = () => {
    overlay.open(({ isOpen, close, unmount }) => {
      const dismiss = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <AppSidebar
          open={isOpen}
          onOpenChange={(open) => !open && dismiss()}
          sections={SECTIONS}
          activePath={pathname}
          space={spaceFromPath(pathname)}
          LinkComponent={SidebarLink}
          onNavigate={dismiss}
        />
      );
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="메뉴 열기"
      data-testid="sidebar-trigger"
      onClick={openSidebar}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
