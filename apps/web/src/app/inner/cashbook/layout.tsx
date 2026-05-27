'use client';

import type { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { useCashbookDisplaySettings } from '@/hooks/useCashbookDisplaySettings';
import { CashbookOpacityStyle } from './CashbookOpacityStyle';

export default function CashbookRootLayout({ children }: { children: ReactNode }) {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? '';
  const { data: displaySettings } = useCashbookDisplaySettings(uid || null);
  const backgroundImageUrl = displaySettings?.backgroundImageUrl ?? null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <CashbookOpacityStyle />
      {backgroundImageUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}
      <div
        className="relative z-10 flex min-h-screen flex-col"
        style={{ opacity: 'var(--cashbook-opacity, 1)' } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
