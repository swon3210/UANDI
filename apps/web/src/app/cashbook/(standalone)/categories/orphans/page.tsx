'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { Header, Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { ChevronLeft, Inbox } from 'lucide-react';
import { userAtom } from '@/stores/auth.store';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useOrphanedEntries, type OrphanGroup } from '@/hooks/useOrphanedEntries';
import { useBulkUpdateEntriesCategory } from '@/hooks/useBulkUpdateEntriesCategory';
import { OrphanGroupCard } from '@/components/cashbook/OrphanGroupCard';
import { RemapCategorySheet } from '@/components/cashbook/RemapCategorySheet';
import { BottomNav } from '@/components/BottomNav';

export default function CashbookOrphansPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  const { data: categories } = useCashbookCategories(coupleId);
  const { groups, totalCount, monthsLoaded, fetchMoreMonths, isLoading } =
    useOrphanedEntries(coupleId, categories);
  const bulkUpdateMutation = useBulkUpdateEntriesCategory(coupleId);

  const openRemapSheet = (group: OrphanGroup, selectedEntryIds: string[]) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <RemapCategorySheet
          fromName={group.name}
          selectedEntryCount={selectedEntryIds.length}
          totalEntryCount={group.entries.length}
          categories={categories ?? []}
          isSubmitting={bulkUpdateMutation.isPending}
          onConfirm={async (newCategoryName) => {
            await bulkUpdateMutation.mutateAsync({
              entryIds: selectedEntryIds,
              newCategoryName,
            });
            close();
            setTimeout(unmount, 300);
          }}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="orphans-header"
        title="미분류 내역 정리"
        leftSlot={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid="header-left"
            onClick={() => router.back()}
          >
            <ChevronLeft size={20} />
          </Button>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            최근 {monthsLoaded}개월
          </span>
          <span className="text-sm font-medium" data-testid="orphans-total-count">
            총 {totalCount}건
          </span>
        </div>

        {isLoading && groups.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Inbox size={48} className="text-muted-foreground" />}
            title="미분류 내역이 없어요"
            description="모든 내역이 현재 카테고리와 매칭되어 있어요."
          />
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <OrphanGroupCard
                key={group.name}
                name={group.name}
                entries={group.entries}
                onRemap={(selectedEntryIds) =>
                  openRemapSheet(group, selectedEntryIds)
                }
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            data-testid="orphans-load-more"
            onClick={() => fetchMoreMonths(1)}
          >
            더 이전 달도 보기
          </Button>
        </div>
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}
