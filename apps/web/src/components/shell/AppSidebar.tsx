'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { overlay } from 'overlay-kit';
import {
  BookOpen,
  Briefcase,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  MessageCircle,
  PiggyBank,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { AppSidebar as AppSidebarUI, type SidebarSection, type Space } from '@uandi/ui';

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'inner',
    label: '우리집',
    Icon: Home,
    items: [
      { id: 'inner-home', label: '홈', href: '/inner', Icon: LayoutDashboard },
      { id: 'photos', label: '사진', href: '/inner/photos', Icon: ImageIcon },
      {
        id: 'cashbook',
        label: '가계부',
        href: '/inner/cashbook/history',
        match: '/inner/cashbook',
        Icon: BookOpen,
      },
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

function AppSidebarSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const space: Space = pathname.startsWith('/community')
    ? 'community'
    : pathname.startsWith('/outer')
      ? 'outer'
      : 'inner';

  return (
    <AppSidebarUI
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      sections={SIDEBAR_SECTIONS}
      activePath={pathname}
      space={space}
      LinkComponent={Link}
      onNavigate={onClose}
    />
  );
}

export function openAppSidebar() {
  overlay.open(({ isOpen, close, unmount }) => (
    <AppSidebarSheet
      isOpen={isOpen}
      onClose={() => {
        close();
        setTimeout(unmount, 300);
      }}
    />
  ));
}
