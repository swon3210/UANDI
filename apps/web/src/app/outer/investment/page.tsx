'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Tabs, TabsList, TabsTrigger } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { PageHeader } from '@/components/shell/PageHeader';
import { MascotLoader } from '@/components/MascotLoader';
import { StocksTab } from '@/components/outer/StocksTab';
import { RealEstateTab } from '@/components/outer/RealEstateTab';

type InvestmentTab = 'stocks' | 'realEstate';

export default function OuterInvestmentPage() {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const coupleId = user?.coupleId ?? null;
  const [tab, setTab] = useState<InvestmentTab>('stocks');

  return (
    <>
      <PageHeader data-testid="outer-investment-header" title="투자" />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-20 pt-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as InvestmentTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="stocks" className="flex-1" data-testid="investment-tab-stocks">
              주식
            </TabsTrigger>
            <TabsTrigger
              value="realEstate"
              className="flex-1"
              data-testid="investment-tab-real-estate"
            >
              부동산
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {!uid || !coupleId ? (
          <MascotLoader fullScreen />
        ) : tab === 'stocks' ? (
          <StocksTab coupleId={coupleId} uid={uid} />
        ) : (
          <RealEstateTab coupleId={coupleId} uid={uid} />
        )}
      </main>
    </>
  );
}
