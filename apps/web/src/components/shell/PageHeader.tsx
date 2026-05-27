'use client';

import type { ComponentProps } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header, SpaceSwitcher, type Space } from '@uandi/ui';

type HeaderProps = ComponentProps<typeof Header>;

function getCurrentSpace(pathname: string): Space {
  return pathname.startsWith('/outer') ? 'outer' : 'inner';
}

/**
 * AppShell 안에서 사용하는 페이지 헤더. shadcn Header 위에 SpaceSwitcher를
 * 자동 prepend하여 어디서나 우리집/재테크 공간 전환이 가능하게 한다.
 */
export function PageHeader({ leftSlot, ...rest }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSpace = getCurrentSpace(pathname);

  return (
    <Header
      {...rest}
      leftSlot={
        <>
          <SpaceSwitcher
            currentSpace={currentSpace}
            onSpaceChange={(space) => {
              router.push(space === 'inner' ? '/inner' : '/outer');
            }}
          />
          {leftSlot}
        </>
      }
    />
  );
}
