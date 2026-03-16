'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from '@uandi/ui';
import { MoreVertical } from 'lucide-react';
import type { CashbookCategory } from '@/types';
import { CategoryIcon } from './CategoryIcon';

type CategoryItemProps = {
  category: CashbookCategory;
  onEdit: (category: CashbookCategory) => void;
  onDelete: (category: CashbookCategory) => void;
};

export function CategoryItem({ category, onEdit, onDelete }: CategoryItemProps) {
  return (
    <div
      data-testid={`category-item-${category.name}`}
      className="flex items-center justify-between py-3 px-2"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: category.color + '20', color: category.color }}
        >
          <CategoryIcon name={category.icon} size={20} />
        </span>
        <span className="text-base font-medium">{category.name}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="더보기">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(category)}>편집</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(category)}>
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
