'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Lightbulb } from 'lucide-react';
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

const schema = z.object({
  initialDate: z.string().min(1, '기준 날짜를 선택해주세요'),
  initialCash: z.number({ error: '최초 현금을 입력해주세요' }).min(0, '0 이상이어야 해요'),
});

type FormValues = z.infer<typeof schema>;

export type CashflowSettingsFormValue = {
  initialCash: number;
  initialDate: Date;
};

type CashflowSettingsFormProps = {
  initial?: CashflowSettingsFormValue;
  onSubmit: (value: CashflowSettingsFormValue) => void;
  onClose: () => void;
};

/**
 * 현금흐름 "최초 현금" 설정 시트(기준일 + 그날의 보유 현금).
 * 기준일 이후 가계부에 기록된 실제 수입·지출을 더해 오늘 잔액이 자동 계산되므로,
 * 한 번 설정하면 매번 다시 맞출 필요가 없다.
 * Phase 2: 큰 지출 예정일(결제일) 수동 입력은 폐지됐다(카테고리 "정기 발생"으로 일원화).
 */
export function CashflowSettingsForm({ initial, onSubmit, onClose }: CashflowSettingsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      initialDate: dayjs(initial?.initialDate ?? new Date()).format('YYYY-MM-DD'),
      initialCash: initial?.initialCash ?? ('' as unknown as number),
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      initialCash: data.initialCash,
      initialDate: dayjs(data.initialDate).toDate(),
    });
    onClose();
  };

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="cashflow-settings-sheet"
    >
      <SheetHeader>
        <SheetTitle>최초 현금 설정</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto overflow-x-hidden px-1 pb-6 pt-4"
        >
          <FormField
            control={form.control}
            name="initialDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>기준 날짜</FormLabel>
                <FormControl>
                  <Input type="date" data-testid="cashflow-initial-date" {...field} />
                </FormControl>
                <p className="text-xs leading-5 text-muted-foreground">
                  이 날 가지고 있던 현금을 기준으로, 이후 기록을 더해 오늘 잔액을 계산해요.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initialCash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>최초 현금 (기준 날짜 기준)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      className="pr-8 text-right text-lg font-semibold"
                      data-testid="cashflow-initial-cash"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      원
                    </span>
                  </div>
                </FormControl>
                <p className="text-xs leading-5 text-muted-foreground">
                  기준 날짜의 보유 현금을 <span className="font-medium text-foreground">한 번만</span>{' '}
                  넣으면, 이후 가계부에 기록한 수입·지출을 자동으로 더해 오늘 잔액과 앞으로의
                  현금흐름을 예측해요. 다시 맞출 필요가 없어요.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 큰 지출 예정일은 카테고리 "정기 발생"으로 일원화됐다(Phase 2). */}
          <div
            className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
            data-testid="cashflow-recurrence-hint"
          >
            <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <p className="leading-5">
              월세·관리비·정기 급여 같은 <span className="font-semibold">고정 지출·수입</span>은
              카테고리의 <span className="font-semibold">정기 발생</span>에서 발생일과 예상 금액을
              설정하면 이 캘린더에 자동으로 표시돼요.
            </p>
          </div>

          <Button type="submit" className="w-full" data-testid="cashflow-settings-save">
            저장
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
