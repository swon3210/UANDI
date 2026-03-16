'use client';
/* eslint-disable react-hooks/incompatible-library -- RHF watch() is known-incompatible with React Compiler */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Button,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@uandi/ui';
import type {
  CashbookEntry,
  CashbookEntryType,
  CashbookCategory,
  CategoryGroup,
} from '@/types';
import { GROUP_LABELS, SUB_GROUPS_BY_GROUP, SUB_GROUP_LABELS } from '@/constants/default-categories';
import { CategoryIcon } from './CategoryIcon';
import type { CategorySubGroup } from '@/types';

const TAB_ORDER: CashbookEntryType[] = ['expense', 'income', 'investment', 'flex'];

const schema = z.object({
  amount: z.number({ error: '금액을 입력해주세요' }).positive('금액을 입력해주세요'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  date: z.string().min(1),
  description: z.string(),
});

type FormValues = z.infer<typeof schema>;

type EntryFormProps = {
  categories: CashbookCategory[];
  editingEntry?: CashbookEntry;
  onSubmit: (data: {
    type: CashbookEntryType;
    amount: number;
    category: string;
    date: Timestamp;
    description: string;
    createdBy: string;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
  createdBy: string;
};

export function EntryForm({
  categories,
  editingEntry,
  onSubmit,
  onDelete,
  onClose,
  createdBy,
}: EntryFormProps) {
  const [activeType, setActiveType] = useState<CashbookEntryType>(
    editingEntry?.type ?? 'expense'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: editingEntry?.amount ?? ('' as unknown as number),
      category: editingEntry?.category ?? '',
      date: editingEntry
        ? dayjs(editingEntry.date.toDate()).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
      description: editingEntry?.description ?? '',
    },
  });

  const selectedCategory = form.watch('category');

  const typeCategories = categories.filter(
    (c) => c.group === (activeType as CategoryGroup)
  );

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      type: activeType,
      amount: data.amount,
      category: data.category,
      date: Timestamp.fromDate(dayjs(data.date).toDate()),
      description: data.description,
      createdBy,
    });
    onClose();
  };

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh] flex flex-col">
      <SheetHeader>
        <SheetTitle>{editingEntry ? '내역 수정' : '내역 추가'}</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto px-1 pb-6 pt-4"
        >
          <Tabs
            value={activeType}
            onValueChange={(v) => {
              setActiveType(v as CashbookEntryType);
              form.setValue('category', '');
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

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>금액</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    className="text-right text-lg font-semibold"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리</FormLabel>
                <FormControl>
                  <CategoryChips
                    categories={typeCategories}
                    activeType={activeType}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>날짜</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메모 (선택)</FormLabel>
                <FormControl>
                  <Input placeholder="메모를 입력하세요" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            {editingEntry && onDelete && (
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
              >
                삭제
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={!selectedCategory || !form.watch('amount')}
            >
              저장
            </Button>
          </div>
        </form>
      </Form>
    </SheetContent>
  );
}

function CategoryChips({
  categories,
  activeType,
  value,
  onChange,
}: {
  categories: CashbookCategory[];
  activeType: CashbookEntryType;
  value: string;
  onChange: (v: string) => void;
}) {
  const [isCustom, setIsCustom] = useState(false);
  const subGroups = SUB_GROUPS_BY_GROUP[activeType as CategoryGroup] ?? [];

  const presetNames = new Set(categories.map((c) => c.name));
  const showCustomInput = isCustom || (value !== '' && !presetNames.has(value));

  const handleCustomToggle = () => {
    setIsCustom(true);
    onChange('');
  };

  const handlePresetClick = (name: string) => {
    setIsCustom(false);
    onChange(name);
  };

  return (
    <div className="space-y-3">
      {subGroups.map((sg) => {
        const items = categories.filter((c) => c.subGroup === sg);
        if (items.length === 0) return null;
        return (
          <div key={sg}>
            <div className="mb-1 text-xs text-muted-foreground">
              {SUB_GROUP_LABELS[sg as CategorySubGroup]}
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`category-chip-${cat.name}`}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    value === cat.name && !showCustomInput
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border hover:bg-accent'
                  }`}
                  onClick={() => handlePresetClick(cat.name)}
                >
                  <CategoryIcon name={cat.icon} size={16} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div>
        <button
          type="button"
          data-testid="category-chip-custom"
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            showCustomInput
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary border-border hover:bg-accent'
          }`}
          onClick={handleCustomToggle}
        >
          직접 입력
        </button>
        {showCustomInput && (
          <Input
            className="mt-2"
            placeholder="카테고리를 입력하세요"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            data-testid="custom-category-input"
            autoFocus
          />
        )}
      </div>
    </div>
  );
}
