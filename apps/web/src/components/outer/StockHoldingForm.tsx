'use client';
/* eslint-disable react-hooks/incompatible-library -- RHF watch() is known-incompatible with React Compiler */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@uandi/ui';
import type { StockHoldingInput } from '@/types';

const optionalNumber = z.number().positive('0보다 크게 입력해주세요').nullable();

const schema = z.object({
  market: z.enum(['KR', 'US']),
  name: z.string().trim().min(1, '종목명을 입력해주세요').max(40),
  symbol: z
    .string()
    .trim()
    .max(10)
    .regex(/^[0-9A-Za-z.\-]*$/, '영문·숫자만 입력해주세요'),
  quantity: z.number({ error: '수량을 입력해주세요' }).positive('수량을 입력해주세요'),
  averagePrice: z
    .number({ error: '평균 매수가를 입력해주세요' })
    .positive('평균 매수가를 입력해주세요'),
  dividendPerShare: optionalNumber,
  nextDividendDate: z.string(),
});

type FormValues = z.infer<typeof schema>;

type StockHoldingFormProps = {
  initial?: StockHoldingInput;
  onSubmit: (input: StockHoldingInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

/** 빈 입력은 NaN → null 로 (선택 숫자 필드) */
function toNullableNumber(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

export function StockHoldingForm({ initial, onSubmit, onDelete, onClose }: StockHoldingFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      market: initial?.market ?? 'KR',
      name: initial?.name ?? '',
      symbol: initial?.symbol ?? '',
      quantity: initial?.quantity ?? ('' as unknown as number),
      averagePrice: initial?.averagePrice ?? ('' as unknown as number),
      dividendPerShare: initial?.dividendPerShare ?? null,
      nextDividendDate: initial?.nextDividendDate ?? '',
    },
  });

  const market = form.watch('market');
  const currencyLabel = market === 'US' ? '달러' : '원';

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      market: values.market,
      currency: values.market === 'US' ? 'USD' : 'KRW',
      name: values.name.trim(),
      symbol: values.symbol.trim().toUpperCase(),
      quantity: values.quantity,
      averagePrice: values.averagePrice,
      dividendPerShare: values.dividendPerShare,
      nextDividendDate: values.nextDividendDate || null,
    });
    onClose();
  };

  return (
    <SheetContent
      side="bottom"
      className="flex h-dvh max-h-none w-full flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
      data-testid="stock-form-sheet"
    >
      <SheetHeader className="flex-row items-center gap-1 space-y-0 border-b border-border px-2 py-2 text-left">
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <SheetTitle className="flex-1 text-base">{initial ? '종목 수정' : '종목 추가'}</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6 pt-4">
            <Tabs value={market} onValueChange={(v) => form.setValue('market', v as 'KR' | 'US')}>
              <TabsList className="w-full">
                <TabsTrigger value="KR" className="flex-1">
                  국내
                </TabsTrigger>
                <TabsTrigger value="US" className="flex-1">
                  미국
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종목명</FormLabel>
                  <FormControl>
                    <Input placeholder={market === 'US' ? '예: 애플' : '예: 삼성전자'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{market === 'US' ? '티커' : '종목코드'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={market === 'US' ? 'AAPL' : '005930'}
                      autoCapitalize="characters"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>입력하면 현재가로 평가손익을 계산해요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>보유 수량</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder="0"
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
                name="averagePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>평균 매수가 ({currencyLabel})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dividendPerShare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주당 배당금 (선택)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(toNullableNumber(e.target.valueAsNumber))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextDividendDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>배당 예정일 (선택)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="border-t border-border bg-background">
            <div className="mx-auto flex w-full max-w-md gap-2 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
              {initial && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  data-testid="stock-delete"
                >
                  삭제
                </Button>
              )}
              <Button type="submit" className="flex-1" data-testid="stock-submit">
                저장
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </SheetContent>
  );
}
