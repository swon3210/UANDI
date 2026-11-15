'use client';

import { MessageSquareText } from 'lucide-react';
import {
  Button,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uandi/ui';
import type { AdminFeedbackFilter, AdminFeedbackItem } from '@/services/admin-feedback';
import type { FeedbackStatus } from '@/types';
import {
  AdminFeedbackCard,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TYPE_LABELS,
} from './AdminFeedbackCard';

export type AdminFeedbackListProps = {
  items: AdminFeedbackItem[];
  filter: AdminFeedbackFilter;
  onFilterChange: (filter: AdminFeedbackFilter) => void;
  onStatusChange: (id: string, status: FeedbackStatus) => void;
  /** 상태를 바꾸는 중인 피드백 id */
  pendingId?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
};

/** 어드민 피드백 탭 본문 — 유형·상태 필터 + 카드 목록 + 더 보기. */
export function AdminFeedbackList({
  items,
  filter,
  onFilterChange,
  onStatusChange,
  pendingId,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: AdminFeedbackListProps) {
  return (
    <div className="space-y-4" data-testid="admin-feedback-list">
      <div className="flex gap-2">
        <Select
          value={filter.type}
          onValueChange={(v) =>
            onFilterChange({ ...filter, type: v as AdminFeedbackFilter['type'] })
          }
        >
          <SelectTrigger data-testid="admin-feedback-type-filter" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.status}
          onValueChange={(v) =>
            onFilterChange({ ...filter, status: v as AdminFeedbackFilter['status'] })
          }
        >
          <SelectTrigger data-testid="admin-feedback-status-filter" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            {Object.entries(FEEDBACK_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText />}
          title="피드백이 없어요"
          description="조건에 맞는 피드백이 아직 없어요"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <AdminFeedbackCard
              key={item.id}
              item={item}
              statusPending={pendingId === item.id}
              onStatusChange={(status) => onStatusChange(item.id, status)}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          data-testid="admin-feedback-more"
        >
          {isLoadingMore ? '불러오는 중…' : '더 보기'}
        </Button>
      ) : null}
    </div>
  );
}
