'use client';
/* eslint-disable react-hooks/incompatible-library -- RHF watch() is known-incompatible with React Compiler */

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
} from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import { CategoryIcon } from './CategoryIcon';

const schema = z.object({
  category: z.string().min(1, '카테고리를 선택해주세요'),
  transactionType: z.enum(['buy', 'sell'], { error: '거래 유형을 선택해주세요' }),
  amount: z.number({ error: '금액을 입력해주세요' }).positive('금액을 입력해주세요'),
  date: z.string().min(1),
  description: z.string(),
});

type FormValues = z.infer<typeof schema>;

type InvestmentEntryFormProps = {
  categories: CashbookCategory[];
  createdBy: string;
  onSubmit: (data: {
    type: 'investment';
    transactionType: 'buy' | 'sell';
    amount: number;
    category: string;
    date: Timestamp;
    description: string;
    createdBy: string;
  }) => void;
  onClose: () => void;
};

export function InvestmentEntryForm({
  categories,
  createdBy,
  onSubmit,
  onClose,
}: InvestmentEntryFormProps) {
  const investmentCategories = categories.filter((c) => c.subGroup === 'investment');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: '',
      transactionType: undefined,
      amount: '' as unknown as number,
      date: dayjs().format('YYYY-MM-DD'),
      description: '',
    },
  });

  const selectedCategory = form.watch('category');

  const selectedTransactionType = form.watch('transactionType');

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      type: 'investment',
      transactionType: data.transactionType,
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
        <SheetTitle>투자 내역 추가</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto px-1 pb-6 pt-4"
        >
          {/* 카테고리 선택 */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {investmentCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          field.value === cat.name
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary border-border hover:bg-accent'
                        }`}
                        onClick={() => field.onChange(cat.name)}
                      >
                        <CategoryIcon name={cat.icon} size={16} />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 거래 유형 선택 */}
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>거래 유형</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        field.value === 'buy'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border hover:bg-accent'
                      }`}
                      onClick={() => field.onChange('buy')}
                    >
                      매수
                    </button>
                    <button
                      type="button"
                      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        field.value === 'sell'
                          ? 'bg-income text-white border-income'
                          : 'bg-secondary border-border hover:bg-accent'
                      }`}
                      onClick={() => field.onChange('sell')}
                    >
                      매도
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                  <Input placeholder="예: 삼성전자 10주" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={!selectedCategory || !selectedTransactionType || !form.watch('amount')}
          >
            저장
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
