'use client';

import { dateFormat } from '@/utils/date';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import {
  Switch,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@uandi/ui';

export type RecurringScheduleValue = {
  enabled: boolean;
  kind: 'dayOfMonth' | 'nthWeekday';
  dayOfMonth?: number;
  week?: number;
  weekday?: number;
  leadDays?: number;
  expectedAmount?: number | null;
  /** 반복 주기(개월). 1=매월, 2=격월, 3=분기, 6=반기, 12=매년. 미지정 시 매월. */
  intervalMonths?: number;
  /** 주기 위상 기준 달("YYYY-MM"). interval>1일 때만 의미. */
  anchorMonth?: string;
};

const FREQUENCY_VALUES = [1, 2, 3, 6, 12] as const;

/** 시작 월 후보: (편집 중 과거 anchor가 있으면 포함) + 이번 달부터 12개월. */
function buildMonthOptions(existing?: string): { value: string; label: string }[] {
  const now = dayjs().startOf('month');
  const out: { value: string; label: string }[] = [];
  const seen = new Set<string>();
  const push = (m: dayjs.Dayjs) => {
    const v = m.format('YYYY-MM');
    if (seen.has(v)) return;
    seen.add(v);
    out.push({ value: v, label: m.format(dateFormat('monthYear')) });
  };
  if (existing && dayjs(`${existing}-01`).isBefore(now)) push(dayjs(`${existing}-01`));
  for (let i = 0; i < 12; i++) push(now.add(i, 'month'));
  return out;
}

type RecurringScheduleFieldsProps = {
  value: RecurringScheduleValue;
  onChange: (next: RecurringScheduleValue) => void;
  /** 수입이면 '들어오는 날', 지출이면 '나가는 날' 등 안내 문구 차이 */
  variant?: 'income' | 'expense';
};

const WEEK_VALUES = [1, 2, 3, 4, 5, -1] as const;

const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 7] as const;

function parseIntOrUndefined(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? undefined : n;
}

function chipClassName(selected: boolean): string {
  return `h-9 min-w-9 rounded-full border px-3 text-sm font-medium transition-colors ${
    selected
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-secondary border-border text-secondary-foreground hover:bg-accent'
  }`;
}

export function RecurringScheduleFields({
  value,
  onChange,
  variant = 'expense',
}: RecurringScheduleFieldsProps) {
  const patch = (partial: Partial<RecurringScheduleValue>) => onChange({ ...value, ...partial });

  const t = useTranslations('cashbook.recurrenceFields');
  const tRec = useTranslations('cashbook.recurrence');
  const FREQUENCY_OPTIONS = FREQUENCY_VALUES.map((value) => ({
    value,
    label: t(`freq.${value}`),
  }));
  const WEEK_OPTIONS = WEEK_VALUES.map((value) => ({ value, label: tRec(`week.${value}`) }));
  const WEEKDAY_OPTIONS = WEEKDAY_VALUES.map((value) => ({
    value,
    label: t(`weekdayShort.${value}`),
  }));
  const occurrenceHint = variant === 'income' ? t('incomeDay') : t('expenseDay');
  const intervalMonths = value.intervalMonths ?? 1;
  const monthOptions = buildMonthOptions(value.anchorMonth);

  /** 빈도 변경: 격월 이상이면 기준 월(anchorMonth)을 이번 달로 자동 지정(비어 있을 때만). */
  const handleIntervalChange = (next: number) => {
    if (next <= 1) {
      patch({ intervalMonths: 1, anchorMonth: undefined });
      return;
    }
    patch({
      intervalMonths: next,
      anchorMonth: value.anchorMonth ?? dayjs().format('YYYY-MM'),
    });
  };

  return (
    <section data-testid="recurrence-section" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold">{t('title')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('description', { day: occurrenceHint })}
          </p>
        </div>
        <Switch
          checked={value.enabled}
          onCheckedChange={(checked) => patch({ enabled: checked })}
          data-testid="recurrence-enabled-switch"
        />
      </div>

      {value.enabled && (
        <div className="flex flex-col gap-4 pl-0.5">
          {/* 발생 빈도 (매월/격월/분기/반기/매년) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t('frequency')}</Label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map((opt) => {
                const selected = intervalMonths === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`recurrence-interval-${opt.value}`}
                    data-selected={selected}
                    className={chipClassName(selected)}
                    onClick={() => handleIntervalChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 시작 월 — 격월 이상일 때만(주기 위상 기준) */}
          {intervalMonths > 1 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recurrence-anchor-month" className="text-sm">
                {t('anchorMonth')}
              </Label>
              <Select
                value={value.anchorMonth ?? monthOptions[0]?.value}
                onValueChange={(v) => patch({ anchorMonth: v })}
              >
                <SelectTrigger
                  id="recurrence-anchor-month"
                  data-testid="recurrence-anchor-month"
                  className="w-40"
                >
                  <SelectValue placeholder={t('anchorMonth')} />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('anchorHint', {
                  freq: FREQUENCY_OPTIONS.find((o) => o.value === intervalMonths)?.label ?? '',
                })}
              </p>
            </div>
          )}

          {/* 발생 주기 방식 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">{t('kind')}</Label>
            <RadioGroup
              value={value.kind}
              onValueChange={(kind) => patch({ kind: kind as RecurringScheduleValue['kind'] })}
              className="flex flex-wrap gap-2"
            >
              {(
                [
                  { value: 'dayOfMonth', label: t('kindDayOfMonth') },
                  { value: 'nthWeekday', label: t('kindNthWeekday') },
                ] as const
              ).map((opt) => (
                <div key={opt.value} className="flex items-center">
                  <RadioGroupItem
                    value={opt.value}
                    id={`recurrence-kind-${opt.value}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`recurrence-kind-${opt.value}`}
                    data-testid={`recurrence-kind-${opt.value}`}
                    className={chipClassName(value.kind === opt.value) + ' flex items-center'}
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 매월 며칠 */}
          {value.kind === 'dayOfMonth' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recurrence-day-input" className="text-sm">
                {t('dayLabel')}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('everyMonth')}</span>
                <Input
                  id="recurrence-day-input"
                  data-testid="recurrence-day-input"
                  type="number"
                  min={1}
                  max={31}
                  className="w-20"
                  value={value.dayOfMonth ?? ''}
                  onChange={(e) => patch({ dayOfMonth: parseIntOrUndefined(e.target.value) })}
                />
                <span className="text-sm text-muted-foreground">{t('daySuffix')}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('dayHint')}</p>
            </div>
          )}

          {/* 매월 몇째 주 + 요일 */}
          {value.kind === 'nthWeekday' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">{t('weekLabel')}</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_OPTIONS.map((opt) => {
                    const selected = value.week === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-testid={`recurrence-week-${opt.value}`}
                        data-selected={selected}
                        className={chipClassName(selected)}
                        onClick={() => patch({ week: opt.value })}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">{t('weekdayLabel')}</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_OPTIONS.map((opt) => {
                    const selected = value.weekday === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-testid={`recurrence-weekday-${opt.value}`}
                        data-selected={selected}
                        className={chipClassName(selected) + ' w-9 px-0'}
                        onClick={() => patch({ weekday: opt.value })}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 며칠 전 알림 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recurrence-lead-input" className="text-sm">
              {t('lead')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="recurrence-lead-input"
                data-testid="recurrence-lead-input"
                type="number"
                min={0}
                max={7}
                className="w-20"
                value={value.leadDays ?? 0}
                onChange={(e) => patch({ leadDays: parseIntOrUndefined(e.target.value) ?? 0 })}
              />
              <span className="text-sm text-muted-foreground">{t('leadSuffix')}</span>
            </div>
          </div>

          {/* 예상 금액 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recurrence-amount-input" className="text-sm">
              {t('expected')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="recurrence-amount-input"
                data-testid="recurrence-amount-input"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder={t('expectedPlaceholder')}
                value={value.expectedAmount ?? ''}
                onChange={(e) =>
                  patch({ expectedAmount: parseIntOrUndefined(e.target.value) ?? null })
                }
              />
              <span className="text-sm text-muted-foreground">{t('won')}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
