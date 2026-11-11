'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User as UserIcon, Settings, LogOut, GraduationCap } from 'lucide-react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';
import { openServiceTour } from '@/components/tutorial/openServiceTour';

/**
 * 전역 프로필 메뉴. PageHeader 우측에 자동으로 붙어 모든 AppShell 페이지에서
 * 계정 설정/로그아웃에 접근할 수 있게 한다.
 */
export function ProfileMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('shell');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="profile-menu-trigger"
          aria-label={t('profileMenu')}
        >
          <Avatar className="h-8 w-8">
            {user?.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName ?? ''} />
            ) : null}
            <AvatarFallback>
              <UserIcon size={16} />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openServiceTour()} data-testid="menu-tour">
          <GraduationCap size={16} className="mr-2" />
          {t('tourAgain')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')} data-testid="menu-settings">
          <Settings size={16} className="mr-2" />
          {t('settings')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()} data-testid="menu-logout">
          <LogOut size={16} className="mr-2" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
