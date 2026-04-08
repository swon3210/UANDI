'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { Plus, Tag, CalendarDays, Bell, Settings } from 'lucide-react';
import { Header, Button, Sheet } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useAddEntry } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { BottomNav } from '@/components/BottomNav';
import {
  useCashbookDisplaySettings,
  useCashbookOpacity,
} from '@/hooks/useCashbookDisplaySettings';

export default function CashbookLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const { data: categories } = useCashbookCategories(coupleId);
  const addMutation = useAddEntry(coupleId);
  const { data: displaySettings } = useCashbookDisplaySettings(uid || null);
  const [opacity] = useCashbookOpacity();
  const backgroundImageUrl = displaySettings?.backgroundImageUrl ?? null;

  const handleAdd = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          createdBy={uid}
          onSubmit={(data) => addMutation.mutate(data)}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {backgroundImageUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}

      <div
        className="relative z-10 flex min-h-screen flex-col"
        style={{ opacity }}
      >
        <Header
          data-testid="cashbook-header"
          title="가계부"
          leftSlot={
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push('/cashbook/history/weekly/notifications')}
                aria-label="알림 설정"
              >
                <Bell size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push('/cashbook/settings')}
                aria-label="가계부 설정"
              >
                <Settings size={20} />
              </Button>
            </div>
          }
          rightSlot={
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push('/cashbook/plan/annual')}
                aria-label="연간 계획"
              >
                <CalendarDays size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push('/cashbook/categories')}
                aria-label="카테고리 설정"
              >
                <Tag size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleAdd}
                aria-label="추가"
                data-testid="add-entry-button"
              >
                <Plus size={20} />
              </Button>
            </div>
          }
        />

        {children}

        <BottomNav activeTab="cashbook" />
      </div>
    </div>
  );
}
