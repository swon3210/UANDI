'use client';
/* eslint-disable react-hooks/incompatible-library -- RHF watch() is known-incompatible with React Compiler */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
import { overlay } from 'overlay-kit';
import { Plus } from 'lucide-react';
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
  Sheet,
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
import { useAddCategory } from '@/hooks/useCashbookCategories';
import { CategoryIcon } from './CategoryIcon';
import { CategoryForm } from './CategoryForm';
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
  coupleId: string | null;
  editingEntry?: CashbookEntry;
  prefill?: {
    type?: CashbookEntryType;
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
  };
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
  coupleId,
  editingEntry,
  prefill,
  onSubmit,
  onDelete,
  onClose,
  createdBy,
}: EntryFormProps) {
  const [activeType, setActiveType] = useState<CashbookEntryType>(
    editingEntry?.type ?? prefill?.type ?? 'expense'
  );
  const addCategoryMutation = useAddCategory(coupleId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: editingEntry?.amount ?? prefill?.amount ?? ('' as unknown as number),
      category: editingEntry?.category ?? prefill?.category ?? '',
      date: editingEntry
        ? dayjs(editingEntry.date.toDate()).format('YYYY-MM-DD')
        : prefill?.date ?? dayjs().format('YYYY-MM-DD'),
      description: editingEntry?.description ?? prefill?.description ?? '',
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
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="entry-form-sheet"
    >
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
                    disableAdd={!coupleId}
                    onAddCategory={() => {
                      overlay.open(({ isOpen, close, unmount }) => (
                        <Sheet
                          open={isOpen}
                          onOpenChange={(open) => !open && close()}
                        >
                          <CategoryForm
                            group={activeType as CategoryGroup}
                            isSubmitting={addCategoryMutation.isPending}
                            onSubmit={async (data) => {
                              await addCategoryMutation.mutateAsync({
                                group: activeType as CategoryGroup,
                                subGroup:
                                  data.subGroup as CashbookCategory['subGroup'],
                                name: data.name,
                                icon: data.icon,
                                color: data.color,
                                isDefault: false,
                                sortOrder: typeCategories.length,
                              });
                              field.onChange(data.name);
                            }}
                            onClose={() => {
                              close();
                              setTimeout(unmount, 300);
                            }}
                          />
                        </Sheet>
                      ));
                    }}
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
  onAddCategory,
  disableAdd,
}: {
  categories: CashbookCategory[];
  activeType: CashbookEntryType;
  value: string;
  onChange: (v: string) => void;
  onAddCategory: () => void;
  disableAdd?: boolean;
}) {
  const subGroups = SUB_GROUPS_BY_GROUP[activeType as CategoryGroup] ?? [];
  const presetNames = new Set(categories.map((c) => c.name));
  const hasOrphanValue = value !== '' && !presetNames.has(value);

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
                    value === cat.name
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border hover:bg-accent'
                  }`}
                  onClick={() => onChange(cat.name)}
                >
                  <CategoryIcon name={cat.icon} size={16} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {hasOrphanValue && (
        <div>
          <div className="mb-1 text-xs text-muted-foreground">선택됨</div>
          <button
            type="button"
            data-testid={`category-chip-${value}`}
            className="rounded-full border px-3 py-1.5 text-sm bg-primary text-primary-foreground border-primary"
            onClick={() => onChange(value)}
          >
            {value}
          </button>
        </div>
      )}
      <button
        type="button"
        data-testid="category-chip-add"
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-muted-foreground"
        onClick={onAddCategory}
        disabled={disableAdd}
      >
        <Plus size={14} />
        카테고리 추가
      </button>
    </div>
  );
}
