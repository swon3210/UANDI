'use client';

import { useTranslations } from 'next-intl';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@uandi/ui';
import { MoreVertical } from 'lucide-react';
import type { CashbookCategory } from '@/types';
import { CategoryIcon } from './CategoryIcon';
import { RecurringBadge } from './RecurringBadge';

type CategoryChildChipProps = {
  category: CashbookCategory;
  onEdit: (category: CashbookCategory) => void;
  onDelete: (category: CashbookCategory) => void;
};

export function CategoryChildChip({ category, onEdit, onDelete }: CategoryChildChipProps) {
  const t = useTranslations('cashbook.categories');
  return (
    <div
      data-testid={`category-child-${category.name}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pl-2 pr-1 text-sm"
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ backgroundColor: category.color + '20', color: category.color }}
      >
        <CategoryIcon name={category.icon} size={12} />
      </span>
      <span>{category.name}</span>
      {category.recurrence?.enabled && <RecurringBadge schedule={category.recurrence} />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            aria-label={t('more')}
            data-testid={`category-child-${category.name}-menu`}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(category)}>{t('edit')}</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(category)}>
            {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
