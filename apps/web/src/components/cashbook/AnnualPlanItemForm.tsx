'use client';

import { useTranslations } from 'next-intl';
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

type ItemFormMessages = { numberOnly: string; min: string; integer: string; tooLarge: string };
const buildSchema = (msg: ItemFormMessages) =>
  z.object({
    categoryId: z.string().optional(),
    annualAmount: z
      .number({ error: msg.numberOnly })
      .min(0, msg.min)
      .int(msg.integer)
      .max(1_000_000_000, msg.tooLarge),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

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
  const t = useTranslations('cashbook.goals.itemForm');
  const schema = buildSchema({
    numberOnly: t('numberOnly'),
    min: t('min'),
    integer: t('integer'),
    tooLarge: t('tooLarge'),
  });
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
      form.setError('categoryId', { message: t('categoryRequired') });
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
        <SheetTitle>{isEditing ? t('editTitle') : t('addTitle')}</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto overflow-x-hidden px-1 pb-6 pt-4"
        >
          {isEditing ? (
            <div className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
              {t.rich('categoryValue', {
                name: editingCategory?.name ?? '—',
                strong: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </div>
          ) : (
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('category')}</FormLabel>
                  <FormControl>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="plan-item-form-category-trigger">
                        <SelectValue placeholder={t('selectCategory')} />
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
                <FormLabel>{t('annualAmount')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder={t('placeholder')}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="px-1 text-[11px] text-stone-400">{t('note')}</p>

          <Button type="submit" className="w-full">
            {t('save')}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
