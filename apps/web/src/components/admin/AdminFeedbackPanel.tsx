'use client';

import { toast } from 'sonner';
import { MascotLoader } from '@/components/MascotLoader';
import { useAdminFeedback, useUpdateFeedbackStatus } from '@/hooks/useAdminFeedback';
import type { AdminFeedbackFilter } from '@/services/admin-feedback';
import { AdminFeedbackList } from './AdminFeedbackList';

type AdminFeedbackPanelProps = {
  query: ReturnType<typeof useAdminFeedback>;
  filter: AdminFeedbackFilter;
  onFilterChange: (filter: AdminFeedbackFilter) => void;
};

/** 어드민 「피드백」 탭 — 목록·필터·상태 변경을 연결한다. 조회는 탭 라벨의 신규 개수와 공유하려고 페이지가 한다. */
export function AdminFeedbackPanel({ query, filter, onFilterChange }: AdminFeedbackPanelProps) {
  const { data, error, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = query;
  const updateStatus = useUpdateFeedbackStatus();

  if (isLoading) return <MascotLoader />;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;

  return (
    <AdminFeedbackList
      items={data?.pages.flatMap((p) => p.items) ?? []}
      filter={filter}
      onFilterChange={onFilterChange}
      pendingId={updateStatus.isPending ? updateStatus.variables?.id : null}
      onStatusChange={(id, status) =>
        updateStatus.mutate(
          { id, status },
          { onError: () => toast.error('상태를 바꾸지 못했어요') }
        )
      }
      hasMore={!!hasNextPage}
      onLoadMore={() => void fetchNextPage()}
      isLoadingMore={isFetchingNextPage}
    />
  );
}
