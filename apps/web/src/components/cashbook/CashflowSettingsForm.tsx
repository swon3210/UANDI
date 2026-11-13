'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { AuthorAvatar } from './AuthorAvatar';
import { formatCurrency } from '@/utils/currency';
import type { CashflowMember } from '@/utils/cashflow';

type SettingsMessages = {
  dateRequired: string;
  amountRequired: string;
  min: string;
  integer: string;
};
const buildSchema = (msg: SettingsMessages) =>
  z.object({
    initialDate: z.string().min(1, msg.dateRequired),
    // uid → 금액. 각 멤버의 최초 현금(0 이상). 빈 값은 0으로 본다.
    cash: z.record(
      z.string(),
      z.number({ error: msg.amountRequired }).min(0, msg.min).int(msg.integer)
    ),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export type CashflowSettingsFormValue = {
  initialCashByUid: Record<string, number>;
  initialDate: Date;
};

type CashflowSettingsFormProps = {
  /** 커플 멤버(사람별 입력 렌더용). 1명이면 입력 1개로 자연 축소. */
  members: CashflowMember[];
  initial?: CashflowSettingsFormValue;
  onSubmit: (value: CashflowSettingsFormValue) => void;
  onClose: () => void;
};

/**
 * 현금흐름 "최초 현금" 설정 시트(기준일 + 그날 각 사람이 보유한 현금).
 * 기준일 이후 가계부에 기록된 실제 수입·지출을 작성자별로 더해 각자 오늘 잔액이 자동 계산되므로,
 * 한 번 설정하면 매번 다시 맞출 필요가 없다.
 * Phase 2: 큰 지출 예정일(결제일) 수동 입력은 폐지됐다(카테고리 "정기 발생"으로 일원화).
 */
export function CashflowSettingsForm({
  members,
  initial,
  onSubmit,
  onClose,
}: CashflowSettingsFormProps) {
  const t = useTranslations('cashbook.cashflow.settings');
  const schema = buildSchema({
    dateRequired: t('dateRequired'),
    amountRequired: t('amountRequired'),
    min: t('min'),
    integer: t('integer'),
  });
  const defaultCash = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of members) {
      const v = initial?.initialCashByUid?.[m.uid];
      out[m.uid] = v == null ? ('' as unknown as number) : v;
    }
    return out;
  }, [members, initial]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      initialDate: dayjs(initial?.initialDate ?? new Date()).format('YYYY-MM-DD'),
      cash: defaultCash,
    },
  });

  const watchedCash = useWatch({ control: form.control, name: 'cash' });
  const total = members.reduce((sum, m) => sum + (Number(watchedCash?.[m.uid]) || 0), 0);

  const handleSubmit = (data: FormValues) => {
    const initialCashByUid: Record<string, number> = {};
    for (const m of members) initialCashByUid[m.uid] = Number(data.cash?.[m.uid]) || 0;
    onSubmit({ initialCashByUid, initialDate: dayjs(data.initialDate).toDate() });
    onClose();
  };

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="cashflow-settings-sheet"
    >
      <SheetHeader>
        <SheetTitle>{t('title')}</SheetTitle>
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
                <FormLabel>{t('date')}</FormLabel>
                <FormControl>
                  <Input type="date" data-testid="cashflow-initial-date" {...field} />
                </FormControl>
                <p className="text-xs leading-5 text-muted-foreground">{t('dateHint')}</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            {/* 섹션 제목 — FormField 밖이라 shadcn FormLabel(useFormField 의존) 대신 일반 라벨. */}
            <p className="text-sm font-medium leading-none">{t('perPerson')}</p>
            {members.map((m, i) => (
              <FormField
                key={m.uid}
                control={form.control}
                name={`cash.${m.uid}`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <AuthorAvatar
                          author={{ displayName: m.displayName, photoURL: m.photoURL }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {m.displayName}
                        </span>
                        <div className="relative w-40">
                          <Input
                            type="number"
                            inputMode="numeric"
                            placeholder="0"
                            className="pr-8 text-right text-base font-semibold"
                            data-testid={`cashflow-initial-cash-${i}`}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            {t('won')}
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {members.length > 1 && (
              <div
                className="flex items-center justify-between border-t border-border/60 pt-2 text-sm"
                data-testid="cashflow-cash-total"
              >
                <span className="text-muted-foreground">{t('total')}</span>
                <span className="font-bold tabular-nums text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
            )}

            <p className="text-xs leading-5 text-muted-foreground">
              {t.rich('hint', {
                strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
              })}
            </p>
          </div>

          {/* 큰 지출 예정일은 카테고리 "정기 발생"으로 일원화됐다(Phase 2). */}
          <div
            className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
            data-testid="cashflow-recurrence-hint"
          >
            <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <p className="leading-5">
              {t.rich('tip', {
                strong: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </p>
          </div>

          <Button type="submit" className="w-full" data-testid="cashflow-settings-save">
            {t('save')}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
