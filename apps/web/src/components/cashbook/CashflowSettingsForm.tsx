'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  currentCash: z.number({ error: '시작 현금을 입력해주세요' }).min(0, '0 이상이어야 해요'),
});

type FormValues = z.infer<typeof schema>;

export type CashflowSettingsFormValue = {
  currentCash: number;
};

type CashflowSettingsFormProps = {
  initial?: CashflowSettingsFormValue;
  onSubmit: (value: CashflowSettingsFormValue) => void;
  onClose: () => void;
};

/**
 * 현금흐름 설정 시트(현재 보유 현금).
 * Phase 2: 큰 지출 예정일(결제일) 수동 입력은 폐지됐다. 고정 지출/수입의 발생일·금액은
 * 카테고리의 "정기 발생"에서 설정하면 캘린더 체크포인트로 자동 반영된다.
 * 변동지출은 "AI 예상 내역"으로 일원화돼 별도 추정 기간 설정은 제거됐다.
 */
export function CashflowSettingsForm({ initial, onSubmit, onClose }: CashflowSettingsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentCash: initial?.currentCash ?? ('' as unknown as number),
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit({ currentCash: data.currentCash });
    onClose();
  };

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="cashflow-settings-sheet"
    >
      <SheetHeader>
        <SheetTitle>시작 현금 설정</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto overflow-x-hidden px-1 pb-6 pt-4"
        >
          <FormField
            control={form.control}
            name="currentCash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시작 현금 (오늘 기준)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      className="pr-8 text-right text-lg font-semibold"
                      data-testid="cashflow-current-cash"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      원
                    </span>
                  </div>
                </FormControl>
                <p className="text-xs leading-5 text-muted-foreground">
                  이 금액에서 <span className="font-medium text-foreground">시작</span>해 앞으로
                  들어오고 나갈 돈을 더해가며 남는 돈을 예측해요. 지금 통장 잔액을 넣고, 실제와
                  달라지면 다시 맞춰주세요.
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
