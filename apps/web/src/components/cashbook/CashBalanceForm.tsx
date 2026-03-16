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
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@uandi/ui';
import type { CashbookCategory, CashBalance } from '@/types';
import { CategoryIcon } from './CategoryIcon';

const schema = z.object({
  balances: z.array(z.object({
    categoryId: z.string(),
    balance: z.number({ error: '금액을 입력해주세요' }).min(0, '0 이상 입력해주세요'),
  })),
});

type FormValues = z.infer<typeof schema>;

type CashBalanceFormProps = {
  categories: CashbookCategory[];
  currentBalances: CashBalance[];
  year: number;
  month: number;
  onSubmit: (data: { categoryId: string; balance: number }[]) => void;
  onClose: () => void;
};

export function CashBalanceForm({
  categories,
  currentBalances,
  year,
  month,
  onSubmit,
  onClose,
}: CashBalanceFormProps) {
  const cashHoldingCategories = categories.filter((c) => c.subGroup === 'cash_holding');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      balances: cashHoldingCategories.map((cat) => {
        const existing = currentBalances.find((b) => b.categoryId === cat.id);
        return {
          categoryId: cat.id,
          balance: existing?.balance ?? ('' as unknown as number),
        };
      }),
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit(data.balances.filter((b) => b.balance > 0));
    onClose();
  };

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh] flex flex-col">
      <SheetHeader>
        <SheetTitle>잔고 업데이트</SheetTitle>
      </SheetHeader>

      <p className="text-sm text-muted-foreground px-1 pt-2">
        {year}년 {month}월 현금 보유 잔고를 입력해주세요.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4 overflow-y-auto px-1 pb-6 pt-4"
        >
          {cashHoldingCategories.map((cat, index) => (
            <FormField
              key={cat.id}
              control={form.control}
              name={`balances.${index}.balance`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CategoryIcon name={cat.icon} size={16} />
                    {cat.name}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      className="text-right font-semibold"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit">저장</Button>
        </form>
      </Form>
    </SheetContent>
  );
}
