'use client';

import { useState } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from 'overlay-kit';
import { Toaster } from '@uandi/ui';
import { createQueryClient } from '@/lib/query-client';
import { AuthInit } from '@/components/AuthInit';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <OverlayProvider>
          <AuthInit />
          {children}
          <Toaster />
        </OverlayProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
