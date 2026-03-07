'use client';

import { User as UserIcon } from 'lucide-react';
import { Header, Avatar, AvatarImage, AvatarFallback } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/BottomNav';
import { RecentPhotos } from './RecentPhotos';
import { MonthlySummaryCard } from './MonthlySummaryCard';
import { RecentEntries } from './RecentEntries';

export function Dashboard() {
  const { user } = useAuth();
  const coupleId = user?.coupleId;

  if (!coupleId) return null;

  return (
    <>
      <Header
        data-testid="dashboard-header"
        title="UANDI"
        rightSlot={
          <Avatar className="h-8 w-8">
            {user?.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName} />
            ) : null}
            <AvatarFallback>
              <UserIcon size={16} />
            </AvatarFallback>
          </Avatar>
        }
      />
      <main className="max-w-md mx-auto px-4 pb-20 pt-4 space-y-6">
        <RecentPhotos coupleId={coupleId} />
        <MonthlySummaryCard coupleId={coupleId} />
        <RecentEntries coupleId={coupleId} />
      </main>
      <BottomNav activeTab="home" />
    </>
  );
}
