'use client';
/* eslint-disable react-hooks/incompatible-library -- RHF watch() is known-incompatible with React Compiler */

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

const VARIABLE_MODES = [1, 3, 6] as const;

const schema = z.object({
  currentCash: z.number({ error: '현재 보유 현금을 입력해주세요' }).min(0, '0 이상이어야 해요'),
  variableMode: z.union([z.literal(1), z.literal(3), z.literal(6)]),
});

type FormValues = z.infer<typeof schema>;

export type CashflowSettingsFormValue = {
  currentCash: number;
  variableMode: 1 | 3 | 6;
};

type CashflowSettingsFormProps = {
  initial?: CashflowSettingsFormValue;
  onSubmit: (value: CashflowSettingsFormValue) => void;
  onClose: () => void;
};

/**
 * 현금흐름 설정 시트(현재 보유 현금 + 변동지출 추정 기간).
 * Phase 2: 큰 지출 예정일(결제일) 수동 입력은 폐지됐다. 고정 지출/수입의 발생일·금액은
 * 카테고리의 "정기 발생"에서 설정하면 캘린더 체크포인트로 자동 반영된다.
 */
export function CashflowSettingsForm({ initial, onSubmit, onClose }: CashflowSettingsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentCash: initial?.currentCash ?? ('' as unknown as number),
      variableMode: initial?.variableMode ?? 3,
    },
  });

  const variableMode = form.watch('variableMode');

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      currentCash: data.currentCash,
      variableMode: data.variableMode,
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
        <SheetTitle>현금흐름 설정</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto px-1 pb-6 pt-4"
        >
          <FormField
            control={form.control}
            name="currentCash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>현재 보유 현금</FormLabel>
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

          <div className="space-y-2">
            <p className="text-sm font-medium">변동지출 추정 기간</p>
            <p className="text-xs text-muted-foreground">
              최근 기간의 평균으로 일별 변동지출을 추정해 카드에 표시해요.
            </p>
            <div className="flex gap-2" data-testid="cashflow-variable-mode">
              {VARIABLE_MODES.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={variableMode === m ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => form.setValue('variableMode', m)}
                >
                  {m}개월
                </Button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" data-testid="cashflow-settings-save">
            저장
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
