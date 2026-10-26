'use client';
/* eslint-disable react-hooks/incompatible-library -- RHF watch() is known-incompatible with React Compiler */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Loader2, Search } from 'lucide-react';
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Switch,
  cn,
} from '@uandi/ui';
import type { RealEstateHoldingInput } from '@/types';
import { LAWD_REGIONS } from '@/constants/lawd-regions';
import { formatEokMan, groupTradesByArea, type AptTrade } from '@/utils/apt-trades';
import { estimateSupplyPyeong } from '@/utils/real-estate-tax';

const MAN = 10_000;

const schema = z.object({
  lawdCd: z.string().regex(/^\d{5}$/, '시/군/구를 선택해주세요'),
  aptName: z.string().trim().min(2, '아파트명을 입력해주세요').max(50),
  dong: z.string(),
  exclusiveArea: z
    .number({ error: '전용면적을 입력해주세요' })
    .positive('전용면적을 입력해주세요')
    .max(500),
  purchasePriceMan: z
    .number({ error: '매수가를 입력해주세요' })
    .positive('매수가를 입력해주세요')
    .int('만원 단위 정수로 입력해주세요'),
  purchaseDate: z.string().min(1, '매수일을 입력해주세요'),
  isSingleHome: z.boolean(),
  manualMarketPriceMan: z.number().positive().int().nullable(),
});

type FormValues = z.infer<typeof schema>;

type RealEstateFormProps = {
  initial?: RealEstateHoldingInput;
  defaultPurchaseDate: string;
  onSearchTrades: (lawdCd: string, aptName: string) => Promise<AptTrade[]>;
  onSubmit: (input: RealEstateHoldingInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

function regionNameOf(lawdCd: string): string {
  const sido = LAWD_REGIONS.find((r) => r.code === lawdCd.slice(0, 2));
  const sigungu = sido?.sigungu.find((s) => s.code === lawdCd);
  if (!sido || !sigungu) return '';
  return sido.name === sigungu.name ? sido.name : `${sido.name} ${sigungu.name}`;
}

export function RealEstateForm({
  initial,
  defaultPurchaseDate,
  onSearchTrades,
  onSubmit,
  onDelete,
  onClose,
}: RealEstateFormProps) {
  const [sidoCode, setSidoCode] = useState(initial?.lawdCd.slice(0, 2) ?? '11');
  const [trades, setTrades] = useState<AptTrade[] | null>(null);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lawdCd: initial?.lawdCd ?? '',
      aptName: initial?.aptName ?? '',
      dong: initial?.dong ?? '',
      exclusiveArea: initial?.exclusiveArea ?? ('' as unknown as number),
      purchasePriceMan: initial
        ? Math.round(initial.purchasePrice / MAN)
        : ('' as unknown as number),
      purchaseDate: initial?.purchaseDate ?? defaultPurchaseDate,
      isSingleHome: initial?.isSingleHome ?? true,
      manualMarketPriceMan: initial?.manualMarketPrice
        ? Math.round(initial.manualMarketPrice / MAN)
        : null,
    },
  });

  const sido = LAWD_REGIONS.find((r) => r.code === sidoCode);
  const lawdCd = form.watch('lawdCd');
  const aptName = form.watch('aptName');
  const selectedArea = form.watch('exclusiveArea');
  const areaOptions = trades ? groupTradesByArea(trades) : [];

  const handleSearch = async () => {
    const valid = await form.trigger(['lawdCd', 'aptName']);
    if (!valid) return;
    setSearchState('loading');
    setSearchError(null);
    try {
      const result = await onSearchTrades(lawdCd, aptName.trim());
      setTrades(result);
      setSearchState('idle');
      if (result.length === 0) {
        setSearchError(
          '최근 6개월 거래를 찾지 못했어요. 아파트명을 확인하거나 전용면적을 직접 입력해 주세요.'
        );
      }
    } catch (e) {
      setTrades(null);
      setSearchState('error');
      setSearchError(
        `${e instanceof Error ? e.message : '실거래가를 가져올 수 없어요'}. 전용면적을 직접 입력해 주세요.`
      );
    }
  };

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      lawdCd: values.lawdCd,
      regionName: regionNameOf(values.lawdCd),
      aptName: values.aptName.trim(),
      dong: values.dong || null,
      exclusiveArea: values.exclusiveArea,
      purchasePrice: values.purchasePriceMan * MAN,
      purchaseDate: values.purchaseDate,
      isSingleHome: values.isSingleHome,
      manualMarketPrice: values.manualMarketPriceMan ? values.manualMarketPriceMan * MAN : null,
    });
    onClose();
  };

  return (
    <SheetContent
      side="bottom"
      className="flex h-dvh max-h-none w-full flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
      data-testid="real-estate-form-sheet"
    >
      <SheetHeader className="flex-row items-center gap-1 space-y-0 border-b border-border px-2 py-2 text-left">
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <SheetTitle className="flex-1 text-base">
          {initial ? '부동산 수정' : '아파트 추가'}
        </SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="real-estate-sido">시/도</Label>
                <Select
                  value={sidoCode}
                  onValueChange={(v) => {
                    setSidoCode(v);
                    form.setValue('lawdCd', '');
                    setTrades(null);
                  }}
                >
                  <SelectTrigger id="real-estate-sido" data-testid="real-estate-sido">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAWD_REGIONS.map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormField
                control={form.control}
                name="lawdCd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시/군/구</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setTrades(null);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="real-estate-sigungu">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sido?.sigungu.map((s) => (
                          <SelectItem key={s.code} value={s.code}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="aptName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아파트명</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="예: 헬리오시티" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSearch}
                      disabled={searchState === 'loading'}
                      data-testid="real-estate-search"
                    >
                      {searchState === 'loading' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      실거래 조회
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {searchError && (
              <p className="text-xs text-muted-foreground" data-testid="real-estate-search-error">
                {searchError}
              </p>
            )}

            {areaOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">평형 선택</p>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((o) => {
                    const active =
                      selectedArea === o.area && form.getValues('aptName') === o.latest.aptName;
                    return (
                      <Button
                        key={`${o.latest.aptName}-${o.area}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="real-estate-area-option"
                        className={cn(
                          'h-auto flex-col items-start gap-0 py-1.5 text-left',
                          active && 'border-primary bg-accent'
                        )}
                        onClick={() => {
                          form.setValue('exclusiveArea', o.area, { shouldValidate: true });
                          form.setValue('aptName', o.latest.aptName);
                          form.setValue('dong', o.dong);
                        }}
                      >
                        <span className="text-xs font-semibold">
                          전용 {o.area}㎡ · 약 {estimateSupplyPyeong(o.area)}평형
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          최근 {formatEokMan(o.latest.price)} · {o.count}건
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="exclusiveArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>전용면적 (㎡)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="84.99"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>평형을 고르면 자동으로 채워져요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="purchasePriceMan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>매수가 (만원)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="150000"
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
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>매수일</FormLabel>
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
              name="isSingleHome"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <FormLabel>1세대 1주택</FormLabel>
                    <FormDescription>재산세 특례·양도세 비과세 추정에 사용해요.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manualMarketPriceMan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>수동 시세 (만원, 선택)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="실거래가가 없을 때만 사용"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : null
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
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
                  data-testid="real-estate-delete"
                >
                  삭제
                </Button>
              )}
              <Button type="submit" className="flex-1" data-testid="real-estate-submit">
                저장
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </SheetContent>
  );
}
