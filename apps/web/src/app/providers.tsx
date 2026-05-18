'use client';

import { useState } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from 'overlay-kit';
import { Toaster, TooltipProvider } from '@uandi/ui';
import { createQueryClient } from '@/lib/query-client';
import { AuthInit } from '@/components/AuthInit';
import { FcmForegroundListener } from '@/components/FcmForegroundListener';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={150}>
          <OverlayProvider>
            <AuthInit />
            <FcmForegroundListener />
            {children}
            <Toaster />
          </OverlayProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
