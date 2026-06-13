'use client';

import type { ComponentProps } from 'react';
import { Header } from '@uandi/ui';
import { ProfileMenu } from '@/components/shell/ProfileMenu';

type HeaderProps = ComponentProps<typeof Header>;

/**
 * AppShell 안에서 사용하는 페이지 헤더. 우측에 전역 프로필 메뉴(설정·로그아웃)를
 * 자동으로 붙여, BottomNav로 이동하는 모든 페이지에서 계정 메뉴에 접근할 수 있게 한다.
 * 페이지별 액션은 rightSlot으로 넘기면 프로필 왼쪽에 배치된다.
 */
export function PageHeader({ rightSlot, ...rest }: HeaderProps) {
  return (
    <Header
      {...rest}
      rightSlot={
        <div className="flex items-center gap-1">
          {rightSlot}
          <ProfileMenu />
        </div>
      }
    />
  );
}
