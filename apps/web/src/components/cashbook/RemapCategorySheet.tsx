'use client';

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
import { GROUP_LABELS } from '@/constants/default-categories';
import { CategoryChips } from './CategoryChips';

const TAB_ORDER: CashbookEntryType[] = ['expense', 'income', 'flex'];

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
  const [activeType, setActiveType] = useState<CashbookEntryType>(initialType);
  const [selected, setSelected] = useState<string>('');

  const typeCategories = categories.filter((c) => c.group === (activeType as CategoryGroup));

  const targetText =
    selectedEntryCount < totalEntryCount
      ? `적용 대상: 선택된 ${selectedEntryCount}건 / 전체 ${totalEntryCount}건`
      : `적용 대상: 전체 ${totalEntryCount}건`;

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="remap-sheet"
    >
      <SheetHeader>
        <SheetTitle>&ldquo;{fromName}&rdquo; 재매칭</SheetTitle>
      </SheetHeader>

      <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-4 pt-3">
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
                {GROUP_LABELS[type as CategoryGroup]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <CategoryChips
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
          취소
        </Button>
        <Button
          type="button"
          className="flex-1"
          data-testid="remap-confirm"
          disabled={!selected || isSubmitting}
          onClick={() => onConfirm(selected)}
        >
          재매칭
        </Button>
      </div>
    </SheetContent>
  );
}
