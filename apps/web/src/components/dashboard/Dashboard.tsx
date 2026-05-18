'use client';

import { useRouter } from 'next/navigation';
import { User as UserIcon, Settings, LogOut } from 'lucide-react';
import {
  Header,
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { getDisplayRate } from '@uandi/investment-core';
import { fetchForexRates } from '@/services/forex';
import { BottomNav } from '@/components/BottomNav';
import { InvestmentEntryCard } from '@/components/investment/InvestmentEntryCard';
import { EntryButtons } from './EntryButtons';
import { BudgetDashboard } from './BudgetDashboard';

export function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const coupleId = user?.coupleId;

  const usdQuery = useQuery({
    queryKey: ['forexRates', 'USD', '1m'],
    queryFn: () => fetchForexRates('USD', '1m'),
    staleTime: 30 * 60 * 1000,
  });
  const usdRate = usdQuery.data ? getDisplayRate(usdQuery.data.latest, 'USD') : undefined;
  const usdPrev =
    usdQuery.data?.prevClose !== null && usdQuery.data?.prevClose !== undefined
      ? getDisplayRate(usdQuery.data.prevClose, 'USD')
      : undefined;
  const usdDiffPercent =
    usdRate !== undefined && usdPrev !== undefined && usdPrev !== 0
      ? ((usdRate - usdPrev) / usdPrev) * 100
      : undefined;

  if (!coupleId) return null;

  return (
    <>
      <Header
        data-testid="dashboard-header"
        title="UANDI"
        rightSlot={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="profile-menu-trigger"
              >
                <Avatar className="h-8 w-8">
                  {user?.photoURL ? (
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                  ) : null}
                  <AvatarFallback>
                    <UserIcon size={16} />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                data-testid="menu-settings"
              >
                <Settings size={16} className="mr-2" />
                설정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()} data-testid="menu-logout">
                <LogOut size={16} className="mr-2" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <main className="max-w-md mx-auto px-4 pb-20 pt-4 space-y-4">
        <EntryButtons />
        <InvestmentEntryCard
          currencyLabel="USD"
          rate={usdRate}
          diffPercent={usdDiffPercent}
          isLoading={usdQuery.isLoading}
        />
        <BudgetDashboard coupleId={coupleId} />
      </main>
      <BottomNav activeTab="home" />
    </>
  );
}
