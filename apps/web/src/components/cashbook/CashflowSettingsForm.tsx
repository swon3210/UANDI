'use client';
/* eslint-disable react-hooks/incompatible-library -- RHF watch() is known-incompatible with React Compiler */

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Plus, Lightbulb } from 'lucide-react';
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
import type { CashflowPayday } from '@/types';

const VARIABLE_MODES = [1, 3, 6] as const;

const paydaySchema = z.object({
  id: z.string(),
  label: z.string().min(1, '항목 이름을 입력해주세요'),
  dayOfMonth: z
    .number({ error: '며칠인지 입력해주세요' })
    .int()
    .min(1, '1~31 사이로 입력해주세요')
    .max(31, '1~31 사이로 입력해주세요'),
});

const schema = z.object({
  currentCash: z.number({ error: '현재 보유 현금을 입력해주세요' }).min(0, '0 이상이어야 해요'),
  variableMode: z.union([z.literal(1), z.literal(3), z.literal(6)]),
  paydays: z.array(paydaySchema),
});

type FormValues = z.infer<typeof schema>;

export type CashflowSettingsFormValue = {
  currentCash: number;
  paydays: CashflowPayday[];
  variableMode: 1 | 3 | 6;
};

type CashflowSettingsFormProps = {
  initial?: CashflowSettingsFormValue;
  onSubmit: (value: CashflowSettingsFormValue) => void;
  onClose: () => void;
};

/** 현금흐름 설정 시트(큰 지출 예정일 + 현재 보유 현금 + 변동지출 추정 기간). */
export function CashflowSettingsForm({ initial, onSubmit, onClose }: CashflowSettingsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentCash: initial?.currentCash ?? ('' as unknown as number),
      variableMode: initial?.variableMode ?? 3,
      paydays: initial?.paydays?.map((p) => ({
        id: p.id,
        label: p.label,
        dayOfMonth: p.dayOfMonth,
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'paydays',
    keyName: '_key',
  });

  const variableMode = form.watch('variableMode');

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      currentCash: data.currentCash,
      variableMode: data.variableMode,
      paydays: data.paydays,
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">큰 지출 예정일</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="cashflow-add-payday"
                onClick={() => append({ id: crypto.randomUUID(), label: '', dayOfMonth: 1 })}
              >
                <Plus size={14} className="mr-1" />
                추가
              </Button>
            </div>

            {/* 입력 가이드 — '결제 수단'이 아니라 '지출 이벤트'를 적도록 명확히 안내 */}
            <div className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
              <p className="leading-5">
                카드 이름이 아니라 <span className="font-semibold">돈이 빠지는 항목</span>을
                적어주세요. (예: 월세, 관리비, 대출이자, 카드값)
              </p>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                큰 지출일이 없으면 주 단위로 묶어서 보여줘요.
              </p>
            )}

            {fields.map((f, index) => (
              <div
                key={f._key}
                className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-2"
                data-testid="cashflow-payday-row"
              >
                <FormField
                  control={form.control}
                  name={`paydays.${index}.label`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="예: 월세, 관리비, 대출이자" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`paydays.${index}.dayOfMonth`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={31}
                            className="pr-10 text-right"
                            aria-label="매월 지출일"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            매월
                          </span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 shrink-0 text-muted-foreground"
                  aria-label="삭제"
                  onClick={() => remove(index)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
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
