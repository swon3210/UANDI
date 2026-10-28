'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/shell/PageHeader';
import { BackButton } from '@/components/shell/BackButton';

/** 대시보드에서 진입하는 (main) 하위 페이지의 헤더 제목 */
function titleOf(pathname: string): string {
  if (pathname.startsWith('/inner/cashbook/review')) return '점검';
  return '내역';
}

export default function CashbookLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';

  return (
    <>
      <PageHeader
        title={titleOf(pathname)}
        data-testid="cashbook-header"
        leftSlot={<BackButton />}
      />
      {children}
    </>
  );
}
