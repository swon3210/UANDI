'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@uandi/ui';
import type { AnnualPlanItem, CashbookCategory } from '@/types';

const schema = z.object({
  categoryId: z.string().optional(),
  annualAmount: z
    .number({ error: '숫자만 입력해 주세요' })
    .min(0, '0 이상이어야 해요')
    .max(1_000_000_000, '너무 큰 금액이에요'),
});

type FormValues = z.infer<typeof schema>;

type AnnualPlanItemFormProps = {
  editingItem?: AnnualPlanItem;
  editingCategory: CashbookCategory | null;
  availableCategories: CashbookCategory[];
  onSubmit: (data: { categoryId: string | null; annualAmount: number }) => Promise<void>;
  onClose: () => void;
};

export function AnnualPlanItemForm({
  editingItem,
  editingCategory,
  availableCategories,
  onSubmit,
  onClose,
}: AnnualPlanItemFormProps) {
  const isEditing = !!editingItem;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: editingItem?.categoryId ?? '',
      annualAmount: editingItem?.annualAmount ?? ('' as unknown as number),
    },
  });

  const handleSubmit = async (data: FormValues) => {
    if (!isEditing && !data.categoryId) {
      form.setError('categoryId', { message: '카테고리를 선택해 주세요' });
      return;
    }
    try {
      await onSubmit({
        categoryId: data.categoryId || null,
        annualAmount: data.annualAmount,
      });
      onClose();
    } catch {
      // mutation onError에서 toast 처리
    }
  };

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="annual-plan-item-form-sheet"
    >
      <SheetHeader>
        <SheetTitle>{isEditing ? '예산 항목 편집' : '예산 항목 추가'}</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto px-1 pb-6 pt-4"
        >
          {isEditing ? (
            <div className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
              카테고리:{' '}
              <span className="font-semibold">{editingCategory?.name ?? '—'}</span>
            </div>
          ) : (
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <FormControl>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="plan-item-form-category-trigger">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="annualAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연간 금액</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="예: 12000000"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="px-1 text-[11px] text-stone-400">
            월별 분배는 12개월 균등으로 설정돼요. 월별 비균등 조정은 메인 화면의 일괄수정에서
            가능해요.
          </p>

          <Button type="submit" className="w-full">
            저장
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
