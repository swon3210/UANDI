'use client';

import type { ComponentProps } from 'react';
import { Header } from '@uandi/ui';
import { ProfileMenu } from '@/components/shell/ProfileMenu';
import { AppSidebarTrigger } from '@/components/shell/AppSidebarTrigger';

type HeaderProps = ComponentProps<typeof Header>;

/**
 * AppShell 안에서 사용하는 페이지 헤더.
 * - 좌측: leftSlot을 지정하지 않으면 사이드바 토글(햄버거 ☰)을 기본으로 붙인다.
 *   드릴다운 페이지가 뒤로가기(←) 등 자체 leftSlot을 넘기면 그것을 우선한다.
 * - 우측: 전역 프로필 메뉴(설정·로그아웃)를 자동으로 붙여 모든 페이지에서 계정 메뉴에 접근하게 한다.
 *   페이지별 액션은 rightSlot으로 넘기면 프로필 왼쪽에 배치된다.
 */
export function PageHeader({ leftSlot, rightSlot, ...rest }: HeaderProps) {
  return (
    <Header
      {...rest}
      leftSlot={leftSlot ?? <AppSidebarTrigger />}
      rightSlot={
        <div className="flex items-center gap-1">
          {rightSlot}
          <ProfileMenu />
        </div>
      }
    />
  );
}
