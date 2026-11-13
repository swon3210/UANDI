'use client';

import { useTranslations } from 'next-intl';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { Header, Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { Inbox } from 'lucide-react';
import { userAtom } from '@/stores/auth.store';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useOrphanedEntries, type OrphanGroup } from '@/hooks/useOrphanedEntries';
import { useBulkUpdateEntriesCategory } from '@/hooks/useBulkUpdateEntriesCategory';
import { OrphanGroupCard } from '@/components/cashbook/OrphanGroupCard';
import { RemapCategorySheet } from '@/components/cashbook/RemapCategorySheet';
import { BackButton } from '@/components/shell/BackButton';

export default function CashbookOrphansPage() {
  const t = useTranslations('cashbook.orphans');
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  const { data: categories } = useCashbookCategories(coupleId);
  const { groups, totalCount, monthsLoaded, fetchMoreMonths, isLoading } = useOrphanedEntries(
    coupleId,
    categories
  );
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
        title={t('title')}
        leftSlot={
          <BackButton fallbackHref="/inner/cashbook/categories" data-testid="header-left" />
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t('recentMonths', { months: monthsLoaded })}
          </span>
          <span className="text-sm font-medium" data-testid="orphans-total-count">
            {t('total', { count: totalCount })}
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
            title={t('emptyTitle')}
            description={t('emptyDescription')}
          />
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <OrphanGroupCard
                key={group.name}
                name={group.name}
                entries={group.entries}
                onRemap={(selectedEntryIds) => openRemapSheet(group, selectedEntryIds)}
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
            {t('loadMore')}
          </Button>
        </div>
      </main>
    </div>
  );
}
