'use client';

import { useCategoryLabels } from '@/i18n/cashbook-labels';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  Button,
} from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType, CategoryGroup } from '@/types';
import { CategoryChips } from './CategoryChips';

const TAB_ORDER: CashbookEntryType[] = ['expense', 'income'];

type RemapCategorySheetProps = {
  fromName: string;
  selectedEntryCount: number;
  totalEntryCount: number;
  categories: CashbookCategory[];
  initialType?: CashbookEntryType;
  isSubmitting?: boolean;
  onConfirm: (newCategoryName: string) => void;
  onClose: () => void;
};

export function RemapCategorySheet({
  fromName,
  selectedEntryCount,
  totalEntryCount,
  categories,
  initialType = 'expense',
  isSubmitting,
  onConfirm,
  onClose,
}: RemapCategorySheetProps) {
  const t = useTranslations('cashbook.orphans');
  const labels = useCategoryLabels();
  const [activeType, setActiveType] = useState<CashbookEntryType>(initialType);
  const [selected, setSelected] = useState<string>('');

  const typeCategories = categories.filter((c) => c.group === (activeType as CategoryGroup));

  const targetText =
    selectedEntryCount < totalEntryCount
      ? t('targetPartial', { selected: selectedEntryCount, total: totalEntryCount })
      : t('targetAll', { total: totalEntryCount });

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="remap-sheet"
    >
      <SheetHeader>
        <SheetTitle>{t('remapTitle', { name: fromName })}</SheetTitle>
      </SheetHeader>

      <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden px-1 pb-4 pt-3">
        <p className="text-xs text-muted-foreground">{targetText}</p>

        <Tabs
          value={activeType}
          onValueChange={(v) => {
            setActiveType(v as CashbookEntryType);
            setSelected('');
          }}
        >
          <TabsList className="w-full">
            {TAB_ORDER.map((type) => (
              <TabsTrigger key={type} value={type} className="flex-1">
                {labels.group(type as CategoryGroup)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <CategoryChips
          key={activeType}
          categories={typeCategories}
          activeType={activeType}
          value={selected}
          onChange={setSelected}
          hideAdd
          hideHint
        />
      </div>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          data-testid="remap-cancel"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
        <Button
          type="button"
          className="flex-1"
          data-testid="remap-confirm"
          disabled={!selected || isSubmitting}
          onClick={() => onConfirm(selected)}
        >
          {t('remap')}
        </Button>
      </div>
    </SheetContent>
  );
}
