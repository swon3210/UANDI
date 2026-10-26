'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@uandi/ui';
import type { SavingsAccountInput } from '@/types';
import { SAVINGS_TAX_LABELS, WEEKDAY_LABELS } from '@/utils/savings';
import { ScreenshotPickButton } from './ScreenshotPickButton';

const schema = z
  .object({
    productType: z.enum(['installment', 'deposit']),
    name: z.string().trim().min(1, '상품명을 입력해주세요').max(50),
    bank: z.string().trim().max(30),
    interestRate: z
      .number({ error: '이율을 입력해주세요' })
      .min(0, '0 이상으로 입력해주세요')
      .max(30, '30% 이하로 입력해주세요'),
    interestMethod: z.enum(['simple', 'compound']),
    startDate: z.string().min(1, '가입일을 입력해주세요'),
    maturityDate: z.string().min(1, '만기일을 입력해주세요'),
    depositAmount: z
      .number({ error: '입금액을 입력해주세요' })
      .positive('입금액을 입력해주세요')
      .int('원 단위 정수로 입력해주세요'),
    depositCycle: z.enum(['monthly', 'weekly']),
    depositDay: z.number().int().min(0).max(31),
    taxType: z.enum(['normal', 'preferential', 'taxFree']),
  })
  .refine((v) => v.maturityDate > v.startDate, {
    message: '만기일은 가입일 이후여야 해요',
    path: ['maturityDate'],
  })
  .refine((v) => v.depositCycle === 'weekly' || v.depositDay >= 1, {
    message: '이체일을 선택해주세요',
    path: ['depositDay'],
  });

export type SavingsFormValues = z.infer<typeof schema>;

type SavingsFormProps = {
  initial?: SavingsAccountInput;
  /** 신규 등록 기본값 (가입일 등) */
  defaults: Pick<SavingsFormValues, 'startDate' | 'maturityDate' | 'depositDay'>;
  /** 캡처 이미지 → 폼에 채울 값. null이면 상품 정보를 찾지 못한 것. */
  onImportScreenshot?: (file: File) => Promise<Partial<SavingsFormValues> | null>;
  onSubmit: (input: SavingsAccountInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

export function SavingsForm({
  initial,
  defaults,
  onImportScreenshot,
  onSubmit,
  onDelete,
  onClose,
}: SavingsFormProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const form = useForm<SavingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? {
      productType: 'installment',
      name: '',
      bank: '',
      interestRate: '' as unknown as number,
      interestMethod: 'simple',
      startDate: defaults.startDate,
      maturityDate: defaults.maturityDate,
      depositAmount: '' as unknown as number,
      depositCycle: 'monthly',
      depositDay: defaults.depositDay,
      taxType: 'normal',
    },
  });

  const productType = form.watch('productType');
  const depositCycle = form.watch('depositCycle');

  const handleImport = async (file: File) => {
    if (!onImportScreenshot) return;
    setIsImporting(true);
    setImportMessage(null);
    try {
      const values = await onImportScreenshot(file);
      if (!values) {
        setImportMessage('캡처에서 예적금 상품 정보를 찾지 못했어요. 직접 입력해 주세요.');
        return;
      }
      form.reset({ ...form.getValues(), ...values });
      setImportMessage('캡처에서 읽은 값으로 채웠어요. 확인 후 저장해 주세요.');
    } catch (e) {
      setImportMessage(e instanceof Error ? e.message : '캡처를 분석하지 못했어요');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = (values: SavingsFormValues) => {
    onSubmit({ ...values, bank: values.bank.trim(), name: values.name.trim() });
    onClose();
  };

  return (
    <SheetContent
      side="bottom"
      className="flex h-dvh max-h-none w-full flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
      data-testid="savings-form-sheet"
    >
      <SheetHeader className="flex-row items-center gap-1 space-y-0 border-b border-border px-2 py-2 text-left">
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <SheetTitle className="flex-1 text-base">
          {initial ? '예적금 수정' : '예적금 등록'}
        </SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6 pt-4">
            {onImportScreenshot && (
              <div className="space-y-2">
                <ScreenshotPickButton
                  onPick={handleImport}
                  isLoading={isImporting}
                  className="w-full"
                  data-testid="savings-import-button"
                >
                  상품 설명 캡처로 자동 입력
                </ScreenshotPickButton>
                <p className="text-xs text-muted-foreground" data-testid="savings-import-message">
                  {importMessage ?? '만기·이율·입금 주기·입금액을 캡처에서 읽어 채워드려요.'}
                </p>
              </div>
            )}

            <Tabs
              value={productType}
              onValueChange={(v) => form.setValue('productType', v as 'installment' | 'deposit')}
            >
              <TabsList className="w-full">
                <TabsTrigger value="installment" className="flex-1">
                  적금 (매달 적립)
                </TabsTrigger>
                <TabsTrigger value="deposit" className="flex-1">
                  예금 (한 번 예치)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상품명</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 우리 청년적금" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>은행 (선택)</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 우리은행" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>적용 이율 (연 %)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="4.5"
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
                name="interestMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이자 계산</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="simple">단리</SelectItem>
                        <SelectItem value="compound">월복리</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>가입일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maturityDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>만기일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{productType === 'deposit' ? '예치 금액' : '회차당 입금액'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      className="text-right"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {productType === 'installment' && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="depositCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>자동이체 주기</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue('depositDay', v === 'weekly' ? 1 : defaults.depositDay);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="savings-cycle-select">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">매월</SelectItem>
                          <SelectItem value="weekly">매주</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="depositDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이체일</FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="savings-day-select">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {depositCycle === 'weekly'
                            ? WEEKDAY_LABELS.map((label, i) => (
                                <SelectItem key={label} value={String(i)}>
                                  {label}요일
                                </SelectItem>
                              ))
                            : DAY_OPTIONS.map((d) => (
                                <SelectItem key={d} value={String(d)}>
                                  {d}일
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="taxType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이자 과세</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(SAVINGS_TAX_LABELS) as (keyof typeof SAVINGS_TAX_LABELS)[]).map(
                        (key) => (
                          <SelectItem key={key} value={key}>
                            {SAVINGS_TAX_LABELS[key]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
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
                  data-testid="savings-delete"
                >
                  삭제
                </Button>
              )}
              <Button type="submit" className="flex-1" data-testid="savings-submit">
                저장
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </SheetContent>
  );
}
