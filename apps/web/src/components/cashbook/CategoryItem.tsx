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
  onAddChild?: (category: CashbookCategory) => void;
  /** 부모 카드 안쪽 행에 자식 chip이나 인라인 액션을 추가할 때 사용. */
  children?: React.ReactNode;
};

export function CategoryItem({
  category,
  onEdit,
  onDelete,
  onAddChild,
  children,
}: CategoryItemProps) {
  return (
    <div
      data-testid={`category-item-${category.name}`}
      className="flex flex-col gap-2 px-2 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: category.color + '20', color: category.color }}
          >
            <CategoryIcon name={category.icon} size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-medium">{category.name}</span>
            {category.description && (
              <span
                data-testid="category-description"
                className="truncate text-xs text-muted-foreground"
              >
                {category.description}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="더보기"
              data-testid={`category-item-${category.name}-menu`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>편집</DropdownMenuItem>
            {onAddChild && (
              <DropdownMenuItem onClick={() => onAddChild(category)}>
                하위 추가
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(category)}
            >
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children}
    </div>
  );
}
