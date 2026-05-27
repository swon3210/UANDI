'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAtomValue } from 'jotai';
import {
  BookOpen,
  Image as ImageIcon,
  LayoutDashboard,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { BottomNav, FullScreenSpinner, type BottomNavItem, type Space } from '@uandi/ui';
import { authStatusAtom } from '@/stores/auth.store';

const INNER_ITEMS: BottomNavItem[] = [
  { id: 'home', label: '홈', href: '/inner', Icon: LayoutDashboard },
  { id: 'photos', label: '사진', href: '/inner/photos', Icon: ImageIcon },
  { id: 'cashbook', label: '가계부', href: '/inner/cashbook', Icon: BookOpen },
];

const OUTER_ITEMS: BottomNavItem[] = [
  { id: 'home', label: '홈', href: '/outer', Icon: LayoutDashboard },
  { id: 'forex', label: '환테크', href: '/outer/forex', Icon: Wallet },
  { id: 'investment', label: '투자', href: '/outer/investment', Icon: TrendingUp },
  { id: 'savings', label: '적금', href: '/outer/savings', Icon: PiggyBank },
];

function getActiveTab(space: Space, pathname: string): string {
  if (space === 'inner') {
    if (pathname.startsWith('/inner/photos')) return 'photos';
    if (pathname.startsWith('/inner/cashbook')) return 'cashbook';
    return 'home';
  }
  if (pathname.startsWith('/outer/forex')) return 'forex';
  if (pathname.startsWith('/outer/investment')) return 'investment';
  if (pathname.startsWith('/outer/savings')) return 'savings';
  return 'home';
}

type AppShellProps = {
  space: Space;
  children: React.ReactNode;
};

export function AppShell({ space, children }: AppShellProps) {
  const authStatus = useAtomValue(authStatusAtom);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/');
    } else if (authStatus === 'authenticated_no_couple') {
      router.replace('/onboarding');
    }
  }, [authStatus, router]);

  if (
    authStatus === 'loading' ||
    authStatus === 'unauthenticated' ||
    authStatus === 'authenticated_no_couple'
  ) {
    return <FullScreenSpinner />;
  }

  const items = space === 'inner' ? INNER_ITEMS : OUTER_ITEMS;
  const activeId = getActiveTab(space, pathname);

  return (
    <div data-space={space} className="min-h-screen pb-16">
      {children}
      <BottomNav items={items} activeId={activeId} LinkComponent={Link} />
    </div>
  );
}
