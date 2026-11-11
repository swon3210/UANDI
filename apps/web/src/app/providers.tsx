'use client';

import { useState } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from 'overlay-kit';
import { Toaster, TooltipProvider } from '@uandi/ui';
import { createQueryClient } from '@/lib/query-client';
import { AuthInit } from '@/components/AuthInit';
import { FcmForegroundListener } from '@/components/FcmForegroundListener';
import { NativeFcmBridge } from '@/components/NativeFcmBridge';
import { NativeSafeAreaFix } from '@/components/NativeSafeAreaFix';
import { KeyboardInsetSync } from '@/components/KeyboardInsetSync';
import { QuickAddBridge } from '@/components/QuickAddBridge';
import { CashbookLiveSync } from '@/components/CashbookLiveSync';
import { OverlayBackButtonHandler } from '@/components/OverlayBackButtonHandler';
import { NavigationTracker } from '@/components/NavigationTracker';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { ClientPlatformTracker } from '@/components/ClientPlatformTracker';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={150}>
          <OverlayProvider>
            <AuthInit />
            <FcmForegroundListener />
            <NativeFcmBridge />
            <NativeSafeAreaFix />
            <KeyboardInsetSync />
            <QuickAddBridge />
            <CashbookLiveSync />
            <OverlayBackButtonHandler />
            <NavigationTracker />
            <AnalyticsTracker />
            <ClientPlatformTracker />
            {children}
            <Toaster />
          </OverlayProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
