'use client';

import { useRouter } from 'next/navigation';
import { User as UserIcon, Settings, LogOut, Target } from 'lucide-react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';
import { BudgetDashboard } from './BudgetDashboard';
import { DashboardEntryList, type DashboardEntry } from './DashboardEntryList';

const ENTRIES: DashboardEntry[] = [
  {
    id: 'budget',
    label: '예산 설정',
    description: '연간 예산 계획',
    href: '/inner/cashbook/plan/annual',
    Icon: Target,
    testId: 'dashboard-entry-budget',
  },
];

export function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const coupleId = user?.coupleId;

  if (!coupleId) return null;

  return (
    <>
      <PageHeader
        title="대시보드"
        data-testid="dashboard-header"
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
        <DashboardEntryList entries={ENTRIES} />
        <BudgetDashboard coupleId={coupleId} />
      </main>
    </>
  );
}
