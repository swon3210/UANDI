'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import {
  Plus,
  Tag,
  CalendarDays,
  CalendarRange,
  Bell,
  Settings,
  MoreVertical,
  FileBarChart,
} from 'lucide-react';
import {
  Button,
  Sheet,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { userAtom } from '@/stores/auth.store';
import { useAddEntry } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { EntryForm } from '@/components/cashbook/EntryForm';

function AddEntrySheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';
  const { data: categories } = useCashbookCategories(coupleId);
  const addMutation = useAddEntry(coupleId);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <EntryForm
        categories={categories ?? []}
        coupleId={coupleId}
        createdBy={uid}
        onSubmit={(data) => addMutation.mutate(data)}
        onClose={onClose}
      />
    </Sheet>
  );
}

export default function CashbookLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleAdd = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <AddEntrySheet
        isOpen={isOpen}
        onClose={() => {
          close();
          setTimeout(unmount, 300);
        }}
      />
    ));
  };

  return (
    <>
      <PageHeader
        title="가계부"
        data-testid="cashbook-header"
        rightSlot={
          <>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="더보기"
                  data-testid="cashbook-more-menu"
                >
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push('/inner/cashbook/cashflow')}
                  data-testid="menu-cashflow"
                >
                  <CalendarRange size={16} className="mr-2" />
                  현금흐름 캘린더
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/inner/cashbook/settlement')}
                  data-testid="menu-settlement"
                >
                  <FileBarChart size={16} className="mr-2" />
                  월 결산
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/inner/cashbook/plan/annual')}
                  data-testid="menu-annual-plan"
                >
                  <CalendarDays size={16} className="mr-2" />
                  연간 계획
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/inner/cashbook/categories')}
                  data-testid="menu-categories"
                >
                  <Tag size={16} className="mr-2" />
                  카테고리 설정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/inner/cashbook/history/weekly/notifications')}
                  data-testid="menu-notifications"
                >
                  <Bell size={16} className="mr-2" />
                  알림 설정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/inner/cashbook/settings')}
                  data-testid="menu-cashbook-settings"
                >
                  <Settings size={16} className="mr-2" />
                  가계부 설정
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {children}
    </>
  );
}
