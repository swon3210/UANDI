'use client';
/* eslint-disable react-hooks/incompatible-library -- RHF watch() is known-incompatible with React Compiler */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { ChevronLeft } from 'lucide-react';
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
import type { CashbookEntry, CashbookEntryType, CashbookCategory, CategoryGroup } from '@/types';
import { GROUP_LABELS } from '@/constants/default-categories';
import { useAddCategory } from '@/hooks/useCashbookCategories';
import { useCoupleMembers } from '@/hooks/useCoupleMembers';
import { CategoryChips } from './CategoryChips';
import { CategoryForm } from './CategoryForm';
import { AuthorAvatar } from './AuthorAvatar';

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
  /** 시트 제목 override. 예측 추가/수정 등 재사용 시 사용. 미지정 시 내역 추가/수정. */
  title?: string;
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
  title,
}: EntryFormProps) {
  const [activeType, setActiveType] = useState<CashbookEntryType>(
    editingEntry?.type ?? prefill?.type ?? 'expense'
  );
  const addCategoryMutation = useAddCategory(coupleId);

  // 편집 모드에서만 작성자 표시 (신규 추가 시 작성자는 본인이고 아직 저장 전).
  const { data: members } = useCoupleMembers(coupleId);
  const author = editingEntry
    ? members?.find((m) => m.uid === editingEntry.createdBy)
    : undefined;

  // 안드로이드 하드웨어/브라우저 뒤로가기는 전역 OverlayBackButtonHandler가
  // (overlay-kit 오버레이 단위로) 페이지 이동 대신 닫기로 처리한다.

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: editingEntry?.amount ?? prefill?.amount ?? ('' as unknown as number),
      category: editingEntry?.category ?? prefill?.category ?? '',
      date: editingEntry
        ? dayjs(editingEntry.date.toDate()).format('YYYY-MM-DD')
        : (prefill?.date ?? dayjs().format('YYYY-MM-DD')),
      description: editingEntry?.description ?? prefill?.description ?? '',
    },
  });

  const selectedCategory = form.watch('category');

  const typeCategories = categories.filter((c) => c.group === (activeType as CategoryGroup));

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
      className="flex h-dvh max-h-none w-full flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
      data-testid="entry-form-sheet"
    >
      <SheetHeader className="flex-row items-center gap-1 space-y-0 border-b border-border px-2 py-2 text-left">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onClose}
          aria-label="닫기"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <SheetTitle className="min-w-0 flex-1 truncate text-base">
          {title ?? (editingEntry ? '내역 수정' : '내역 추가')}
        </SheetTitle>
        {author && (
          <div className="flex shrink-0 items-center gap-1.5 pr-1 text-xs text-muted-foreground">
            <AuthorAvatar author={author} />
            <span className="max-w-[88px] truncate">{author.displayName}</span>
          </div>
        )}
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-4">
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
                      key={activeType}
                      categories={typeCategories}
                      activeType={activeType}
                      value={field.value}
                      memo={form.watch('description')}
                      onChange={field.onChange}
                      disableAdd={!coupleId}
                      onAddCategory={() => {
                        overlay.open(({ isOpen, close, unmount }) => (
                          <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
                            <CategoryForm
                              group={activeType as CategoryGroup}
                              isSubmitting={addCategoryMutation.isPending}
                              onSubmit={async (data) => {
                                await addCategoryMutation.mutateAsync({
                                  group: activeType as CategoryGroup,
                                  subGroup: data.subGroup as CashbookCategory['subGroup'],
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
          </div>

          <div className="border-t border-border bg-background">
            <div className="mx-auto flex w-full max-w-md gap-2 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
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
          </div>
        </form>
      </Form>
    </SheetContent>
  );
}
