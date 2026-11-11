'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { isIosNative } from '@/lib/native';

type SectionLabels = ReturnType<typeof useTranslations<'shell.sections'>>;

/**
 * 사이드바 섹션 구성. 공간(우리집/재테크/커뮤니티)별로 실제 존재하는 목적지만 노출한다.
 * (하단탭을 대체 — docs/08-spaces.md §4 참고)
 */
function buildSections(t: SectionLabels): SidebarSection[] {
  return [
    {
      id: 'inner',
      label: t('inner'),
      Icon: Home,
      items: [
        { id: 'cashbook', label: t('cashbook'), href: '/inner/cashbook', Icon: BookOpen },
        { id: 'photos', label: t('photos'), href: '/inner/photos', Icon: ImageIcon },
      ],
    },
    {
      id: 'outer',
      label: t('outer'),
      Icon: Briefcase,
      items: [
        { id: 'outer-home', label: t('outerHome'), href: '/outer', Icon: LayoutDashboard },
        { id: 'forex', label: t('forex'), href: '/outer/forex', Icon: Wallet },
        { id: 'investment', label: t('investment'), href: '/outer/investment', Icon: TrendingUp },
        { id: 'savings', label: t('savings'), href: '/outer/savings', Icon: PiggyBank },
      ],
    },
    {
      id: 'community',
      label: t('community'),
      Icon: Users,
      items: [
        {
          id: 'community-feed',
          label: t('communityFeed'),
          href: '/community',
          Icon: MessageCircle,
        },
      ],
    },
  ];
}

/**
 * 노출할 사이드바 섹션. iOS 네이티브(App Store 심사 대응)에서는 "우리집 > 가계부" 하나만
 * 남기고 갤러리 항목·재테크 섹션·커뮤니티 섹션을 숨긴다. Android/웹 브라우저는 전체 노출.
 */
function visibleSections(sections: SidebarSection[]): SidebarSection[] {
  if (!isIosNative()) return sections;
  return sections
    .filter((s) => s.id === 'inner')
    .map((s) => ({ ...s, items: s.items.filter((i) => i.id === 'cashbook') }));
}

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
  const t = useTranslations('shell');
  const tSections = useTranslations('shell.sections');

  const openSidebar = () => {
    // 클릭 시점(순수 클라이언트)에 계산 — SSR/hydration 불일치 없이 iOS 여부를 반영한다.
    const sections = visibleSections(buildSections(tSections));
    overlay.open(({ isOpen, close, unmount }) => {
      const dismiss = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <AppSidebar
          open={isOpen}
          onOpenChange={(open) => !open && dismiss()}
          sections={sections}
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
      aria-label={t('openMenu')}
      data-testid="sidebar-trigger"
      onClick={openSidebar}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
