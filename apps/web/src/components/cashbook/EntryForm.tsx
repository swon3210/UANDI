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
  Badge,
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
import {
  GROUP_LABELS,
  SUB_GROUPS_BY_GROUP,
  SUB_GROUP_LABELS,
  SUB_GROUP_SHORT_LABELS,
} from '@/constants/default-categories';
import { useAddCategory } from '@/hooks/useCashbookCategories';
import { CategoryIcon } from './CategoryIcon';
import { CategoryForm } from './CategoryForm';
import type { CategorySubGroup } from '@/types';

const MAX_RECOMMENDATIONS = 3;

function findCategoryByName(
  categories: CashbookCategory[],
  name: string,
  group: CategoryGroup
): CashbookCategory | undefined {
  return categories.find((c) => c.name === name && c.group === group);
}

function recommendCategories(
  categories: CashbookCategory[],
  memo: string
): CashbookCategory[] {
  const trimmed = memo.trim();
  if (trimmed.length === 0) return [];
  const lower = trimmed.toLowerCase();
  const matches: CashbookCategory[] = [];
  for (const cat of categories) {
    const hit =
      cat.examples.some((ex) => {
        const exLower = ex.toLowerCase();
        return exLower.includes(lower) || lower.includes(exLower);
      }) || cat.name.toLowerCase().includes(lower);
    if (hit) matches.push(cat);
    if (matches.length >= MAX_RECOMMENDATIONS) break;
  }
  return matches;
}

const TAB_ORDER: CashbookEntryType[] = ['expense', 'income', 'flex'];

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
                    memo={form.watch('description')}
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
                                parentCategoryId: null,
                                description: data.description,
                                examples: data.examples,
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
  memo,
  onChange,
  onAddCategory,
  disableAdd,
}: {
  categories: CashbookCategory[];
  activeType: CashbookEntryType;
  value: string;
  memo: string;
  onChange: (v: string) => void;
  onAddCategory: () => void;
  disableAdd?: boolean;
}) {
  const subGroups = SUB_GROUPS_BY_GROUP[activeType as CategoryGroup] ?? [];
  const group = activeType as CategoryGroup;

  const parents = categories.filter((c) => c.parentCategoryId === null);
  const childrenByParent = new Map<string, CashbookCategory[]>();
  for (const c of categories) {
    if (c.parentCategoryId) {
      const list = childrenByParent.get(c.parentCategoryId) ?? [];
      list.push(c);
      childrenByParent.set(c.parentCategoryId, list);
    }
  }

  const selectedCat = value ? findCategoryByName(categories, value, group) : undefined;
  const selectedParent =
    selectedCat?.parentCategoryId
      ? categories.find((c) => c.id === selectedCat.parentCategoryId)
      : undefined;
  const presetNames = new Set(categories.map((c) => c.name));
  const hasOrphanValue = value !== '' && !presetNames.has(value);

  const recommended = recommendCategories(categories, memo).filter(
    (c) => c.name !== value
  );

  const [expandedParentId, setExpandedParentId] = useState<string | null>(
    selectedParent?.id ?? null
  );

  return (
    <div className="space-y-3">
      {subGroups.map((sg) => {
        const subParents = parents.filter((c) => c.subGroup === sg);
        if (subParents.length === 0) return null;
        return (
          <div key={sg}>
            <div className="mb-1 text-xs text-muted-foreground">
              {SUB_GROUP_LABELS[sg as CategorySubGroup]}
            </div>
            <div className="flex flex-col gap-2">
              {subParents.map((parent) => {
                const children = (childrenByParent.get(parent.id) ?? []).sort(
                  (a, b) => a.sortOrder - b.sortOrder
                );
                const hasChildren = children.length > 0;
                const expanded =
                  expandedParentId === parent.id ||
                  selectedParent?.id === parent.id;
                const isSelectedParent = value === parent.name && !selectedParent;

                return (
                  <div key={parent.id} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        data-testid={`category-chip-${parent.name}`}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          isSelectedParent
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary border-border hover:bg-accent'
                        }`}
                        onClick={() => {
                          onChange(parent.name);
                          if (hasChildren) setExpandedParentId(parent.id);
                        }}
                      >
                        <CategoryIcon name={parent.icon} size={16} />
                        {parent.name}
                        {hasChildren && (
                          <span
                            data-testid={`category-chip-${parent.name}-toggle`}
                            aria-label="자식 펼치기"
                            className="ml-0.5 text-xs opacity-60"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedParentId((prev) =>
                                prev === parent.id ? null : parent.id
                              );
                            }}
                          >
                            ▾
                          </span>
                        )}
                      </button>
                    </div>
                    {hasChildren && expanded && (
                      <div className="ml-4 flex flex-wrap gap-1.5">
                        {children.map((child) => {
                          const isSelected = value === child.name;
                          return (
                            <button
                              key={child.id}
                              type="button"
                              data-testid={`category-chip-${child.name}`}
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-border hover:bg-accent'
                              }`}
                              onClick={() => {
                                onChange(child.name);
                                setExpandedParentId(parent.id);
                              }}
                            >
                              <CategoryIcon name={child.icon} size={12} />
                              {child.name}
                              <Badge
                                variant="secondary"
                                className="px-1 py-0 text-[9px] font-normal"
                              >
                                {SUB_GROUP_SHORT_LABELS[child.subGroup]}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {selectedCat && (
        <div className="rounded-md border border-border bg-muted/50 p-2.5 text-xs">
          <div data-testid="category-breadcrumb" className="font-medium">
            {selectedParent ? (
              <>
                {selectedParent.name}{' '}
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                  {SUB_GROUP_SHORT_LABELS[selectedParent.subGroup]}
                </Badge>{' '}
                <span className="text-muted-foreground">&gt;</span> {selectedCat.name}
              </>
            ) : (
              <>
                {selectedCat.name}{' '}
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                  {SUB_GROUP_SHORT_LABELS[selectedCat.subGroup]}
                </Badge>
              </>
            )}
          </div>
          {(selectedCat.description || selectedCat.examples.length > 0) && (
            <div data-testid="category-hint" className="mt-1 text-muted-foreground">
              {selectedCat.description && <span>{selectedCat.description}</span>}
              {selectedCat.examples.length > 0 && (
                <span>
                  {selectedCat.description ? ' · ' : ''}예시:{' '}
                  {selectedCat.examples.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {recommended.length > 0 && (
        <div data-testid="category-recommendations">
          <div className="mb-1 text-xs text-muted-foreground">
            메모와 비슷한 카테고리
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recommended.map((cat) => (
              <button
                key={`rec-${cat.id}`}
                type="button"
                data-testid={`recommended-chip-${cat.name}`}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/60 bg-accent px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  onChange(cat.name);
                  if (cat.parentCategoryId) {
                    setExpandedParentId(cat.parentCategoryId);
                  }
                }}
              >
                <CategoryIcon name={cat.icon} size={12} />
                {cat.name}
                <Badge
                  variant="secondary"
                  className="px-1 py-0 text-[9px] font-normal"
                >
                  {SUB_GROUP_SHORT_LABELS[cat.subGroup]}
                </Badge>
              </button>
            ))}
          </div>
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
