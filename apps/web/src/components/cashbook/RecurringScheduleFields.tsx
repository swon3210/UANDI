'use client';

import { Switch, Input, Label, RadioGroup, RadioGroupItem } from '@uandi/ui';

export type RecurringScheduleValue = {
  enabled: boolean;
  kind: 'dayOfMonth' | 'nthWeekday';
  dayOfMonth?: number;
  week?: number;
  weekday?: number;
  leadDays?: number;
  expectedAmount?: number | null;
};

type RecurringScheduleFieldsProps = {
  value: RecurringScheduleValue;
  onChange: (next: RecurringScheduleValue) => void;
  /** 수입이면 '들어오는 날', 지출이면 '나가는 날' 등 안내 문구 차이 */
  variant?: 'income' | 'expense';
};

const WEEK_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '첫째' },
  { value: 2, label: '둘째' },
  { value: 3, label: '셋째' },
  { value: 4, label: '넷째' },
  { value: 5, label: '다섯째' },
  { value: -1, label: '마지막' },
];

const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 7, label: '일' },
];

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

  const occurrenceHint = variant === 'income' ? '들어오는 날' : '나가는 날';

  return (
    <section data-testid="recurrence-section" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold">정기 발생 알림</Label>
          <p className="text-xs text-muted-foreground">
            매월 {occurrenceHint}에 맞춰 기록 알림을 받아요.
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
          {/* 발생 주기 방식 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">발생 주기</Label>
            <RadioGroup
              value={value.kind}
              onValueChange={(kind) => patch({ kind: kind as RecurringScheduleValue['kind'] })}
              className="flex flex-wrap gap-2"
            >
              {(
                [
                  { value: 'dayOfMonth', label: '매월 며칠' },
                  { value: 'nthWeekday', label: '매월 몇째 주' },
                ] as const
              ).map((opt) => (
                <div key={opt.value} className="flex items-center">
                  <RadioGroupItem value={opt.value} id={`recurrence-kind-${opt.value}`} className="sr-only" />
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
                매월 며칠
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">매월</span>
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
                <span className="text-sm text-muted-foreground">일</span>
              </div>
              <p className="text-xs text-muted-foreground">
                해당 월에 그 날이 없으면 말일에 알림을 보내요.
              </p>
            </div>
          )}

          {/* 매월 몇째 주 + 요일 */}
          {value.kind === 'nthWeekday' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">몇째 주</Label>
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
                <Label className="text-sm">요일</Label>
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
              미리 알림
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
              <span className="text-sm text-muted-foreground">일 전 (0 = 당일)</span>
            </div>
          </div>

          {/* 예상 금액 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recurrence-amount-input" className="text-sm">
              예상 금액 (선택)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="recurrence-amount-input"
                data-testid="recurrence-amount-input"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="예: 800000"
                value={value.expectedAmount ?? ''}
                onChange={(e) =>
                  patch({ expectedAmount: parseIntOrUndefined(e.target.value) ?? null })
                }
              />
              <span className="text-sm text-muted-foreground">원</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
