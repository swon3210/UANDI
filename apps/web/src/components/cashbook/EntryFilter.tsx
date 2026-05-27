'use client';

import { Tabs, TabsList, TabsTrigger, Button } from '@uandi/ui';
import { X } from 'lucide-react';
import type { CashbookCategory, CashbookEntryType, CategoryGroup } from '@/types';
import { GROUP_LABELS } from '@/constants/default-categories';
import { CategoryIcon } from './CategoryIcon';

export type EntryFilterType = CashbookEntryType | 'all';

type EntryFilterProps = {
  categories: CashbookCategory[];
  typeFilter: EntryFilterType;
  selectedCategoryNames: string[];
  onTypeChange: (t: EntryFilterType) => void;
  onCategoryToggle: (name: string) => void;
  onReset: () => void;
};

const TYPE_ORDER: EntryFilterType[] = ['all', 'expense', 'income', 'flex'];
const TYPE_LABELS: Record<EntryFilterType, string> = {
  all: '전체',
  expense: GROUP_LABELS.expense,
  income: GROUP_LABELS.income,
  flex: GROUP_LABELS.flex,
};

function getVisibleCategories(
  categories: CashbookCategory[],
  typeFilter: EntryFilterType
): CashbookCategory[] {
  const filtered =
    typeFilter === 'all'
      ? categories
      : categories.filter((c) => c.group === (typeFilter as CategoryGroup));
  return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function EntryFilter({
  categories,
  typeFilter,
  selectedCategoryNames,
  onTypeChange,
  onCategoryToggle,
  onReset,
}: EntryFilterProps) {
  const visibleCategories = getVisibleCategories(categories, typeFilter);
  const hasCategorySelection = selectedCategoryNames.length > 0;

  return (
    <div data-testid="entry-filter" className="space-y-2">
      <Tabs value={typeFilter} onValueChange={(v) => onTypeChange(v as EntryFilterType)}>
        <TabsList className="w-full">
          {TYPE_ORDER.map((t) => (
            <TabsTrigger key={t} value={t} data-testid={`filter-type-${t}`} className="flex-1">
              {TYPE_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visibleCategories.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-1.5 pb-1">
            {visibleCategories.map((category) => {
              const selected = selectedCategoryNames.includes(category.name);
              return (
                <button
                  key={category.id}
                  type="button"
                  data-testid={`filter-category-chip-${category.name}`}
                  aria-pressed={selected}
                  onClick={() => onCategoryToggle(category.name)}
                  className={
                    'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ' +
                    (selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-accent')
                  }
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full"
                    style={
                      selected
                        ? undefined
                        : { backgroundColor: category.color + '20', color: category.color }
                    }
                  >
                    <CategoryIcon name={category.icon} size={10} />
                  </span>
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasCategorySelection && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{selectedCategoryNames.length}개 선택됨</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="filter-reset"
            onClick={onReset}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            <X className="mr-0.5 h-3 w-3" />
            초기화
          </Button>
        </div>
      )}
    </div>
  );
}
