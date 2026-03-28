'use client';

import { FolderOpen } from 'lucide-react';
import { EmptyState, Skeleton } from '@uandi/ui';
import type { CashbookCategory, CategoryGroup, CategorySubGroup } from '@/types';
import { SUB_GROUPS_BY_GROUP, SUB_GROUP_LABELS, GROUP_LABELS } from '@/constants/default-categories';
import { CategoryItem } from './CategoryItem';

type CategoryListProps = {
  categories: CashbookCategory[];
  group: CategoryGroup;
  isLoading?: boolean;
  onEdit: (category: CashbookCategory) => void;
  onDelete: (category: CashbookCategory) => void;
};

function CategoryListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((group) => (
        <div key={group}>
          <Skeleton className="mb-1 mx-2 h-3 w-16" />
          <div className="rounded-xl bg-card border border-border divide-y divide-border">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryList({ categories, group, isLoading, onEdit, onDelete }: CategoryListProps) {
  const subGroups = SUB_GROUPS_BY_GROUP[group];

  if (isLoading) {
    return <CategoryListSkeleton />;
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen size={48} className="text-muted-foreground" />}
        title={`${GROUP_LABELS[group]} 카테고리가 없습니다`}
        description="아래 버튼으로 카테고리를 추가해보세요"
      />
    );
  }

  return (
    <div className="space-y-4">
      {subGroups.map((subGroup) => {
        const items = categories.filter((c) => c.subGroup === subGroup);
        if (items.length === 0) return null;

        return (
          <div key={subGroup}>
            <div
              data-testid={`subgroup-header-${subGroup}`}
              className="mb-1 px-2 text-xs font-medium tracking-wide text-muted-foreground"
            >
              {SUB_GROUP_LABELS[subGroup as CategorySubGroup]}
            </div>
            <div className="rounded-xl bg-card border border-border divide-y divide-border">
              {items.map((cat) => (
                <CategoryItem
                  key={cat.id}
                  category={cat}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
