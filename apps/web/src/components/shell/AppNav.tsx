'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Image as ImageIcon, TrendingUp, Users } from 'lucide-react';
import { AppNav as AppNavUI, type AppNavItem } from '@uandi/ui';

const NAV_ITEMS: AppNavItem[] = [
  { id: 'cashbook', label: '가계부', href: '/inner/cashbook', Icon: BookOpen },
  { id: 'photos', label: '갤러리', href: '/inner/photos', Icon: ImageIcon },
  { id: 'outer', label: '재테크', href: '/outer', Icon: TrendingUp },
  { id: 'community', label: '커뮤니티', href: '/community', Icon: Users },
];

/**
 * 전역 하단탭. AppShell 안에서 인증·커플 연결 사용자에게 상시 노출한다.
 * 가계부 탭의 루트(`/inner/cashbook`)는 대시보드(예산 요약)를 렌더한다.
 */
export function AppNav() {
  const pathname = usePathname();
  return <AppNavUI items={NAV_ITEMS} activePath={pathname} LinkComponent={Link} />;
}
