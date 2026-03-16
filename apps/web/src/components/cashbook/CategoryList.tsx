'use client';

import { FolderOpen } from 'lucide-react';
import { EmptyState } from '@uandi/ui';
import type { CashbookCategory, CategoryGroup, CategorySubGroup } from '@/types';
import {
  SUB_GROUPS_BY_GROUP,
  SUB_GROUP_LABELS,
  GROUP_LABELS,
} from '@/constants/default-categories';
import { CategoryItem } from './CategoryItem';

type CategoryListProps = {
  categories: CashbookCategory[];
  group: CategoryGroup;
  onEdit: (category: CashbookCategory) => void;
  onDelete: (category: CashbookCategory) => void;
};

export function CategoryList({ categories, group, onEdit, onDelete }: CategoryListProps) {
  const subGroups = SUB_GROUPS_BY_GROUP[group];

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
                <CategoryItem key={cat.id} category={cat} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
