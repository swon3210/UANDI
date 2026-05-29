'use client';

import type { ComponentProps } from 'react';
import { Menu } from 'lucide-react';
import { Button, Header } from '@uandi/ui';
import { openAppSidebar } from '@/components/shell/AppSidebar';

type HeaderProps = ComponentProps<typeof Header>;

/**
 * AppShell 안에서 사용하는 페이지 헤더. shadcn Header 좌측에 사이드바 토글
 * 메뉴 버튼을 자동 prepend하여 어디서나 공간/페이지 이동이 가능하게 한다.
 */
export function PageHeader({ leftSlot, ...rest }: HeaderProps) {
  return (
    <Header
      {...rest}
      leftSlot={
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={openAppSidebar}
            aria-label="메뉴 열기"
            data-testid="sidebar-trigger"
          >
            <Menu size={20} />
          </Button>
          {leftSlot}
        </>
      }
    />
  );
}
