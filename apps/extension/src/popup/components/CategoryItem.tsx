import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from '@uandi/ui';
import { MoreVertical } from 'lucide-react';
import type { CashbookCategory } from '@uandi/cashbook-core';
import { CategoryIcon } from './CategoryIcon';

type CategoryItemProps = {
  category: CashbookCategory;
  onEdit: (category: CashbookCategory) => void;
  onDelete: (category: CashbookCategory) => void;
};

export function CategoryItem({ category, onEdit, onDelete }: CategoryItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-2">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: category.color + '20', color: category.color }}
        >
          <CategoryIcon name={category.icon} size={18} />
        </span>
        <span className="text-sm font-medium">{category.name}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="더보기">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(category)}>편집</DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(category)}
          >
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
