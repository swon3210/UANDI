'use client';

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
  /** 발생일에 실제 내역을 자동 기록(docs/pages/inner/cashbook-recurring-auto-record.md). */
  autoRecord?: boolean;
  /** 자동 기록 내역의 작성자 uid. */
  payerUid?: string | null;
};

/** 자동 기록 기록자 후보(커플 멤버). label은 "나" / 짝꿍 이름. */
export type PayerOption = { uid: string; label: string };

const FREQUENCY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '매월' },
  { value: 2, label: '격월' },
  { value: 3, label: '분기' },
  { value: 6, label: '반기' },
  { value: 12, label: '매년' },
];

/** 시작 월 후보: (편집 중 과거 anchor가 있으면 포함) + 이번 달부터 12개월. */
function buildMonthOptions(existing?: string): { value: string; label: string }[] {
  const now = dayjs().startOf('month');
  const out: { value: string; label: string }[] = [];
  const seen = new Set<string>();
  const push = (m: dayjs.Dayjs) => {
    const v = m.format('YYYY-MM');
    if (seen.has(v)) return;
    seen.add(v);
    out.push({ value: v, label: m.format('YYYY년 M월') });
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
  /** 자동 기록 기록자 후보. 비어 있거나 1명이면 칩을 숨기고 defaultPayerUid(또는 유일한 멤버)를 쓴다. */
  payerOptions?: PayerOption[];
  /** 자동 기록을 켤 때 기본 기록자(보통 현재 사용자). */
  defaultPayerUid?: string;
};

/** 자동 기록을 켤 수 있는 조건(명세 D2): 예상 금액이 양수 */
export function canAutoRecord(value: Pick<RecurringScheduleValue, 'expectedAmount'>): boolean {
  return value.expectedAmount != null && value.expectedAmount > 0;
}

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
  payerOptions = [],
  defaultPayerUid,
}: RecurringScheduleFieldsProps) {
  const patch = (partial: Partial<RecurringScheduleValue>) => onChange({ ...value, ...partial });

  const occurrenceHint = variant === 'income' ? '들어오는 날' : '나가는 날';
  const intervalMonths = value.intervalMonths ?? 1;
  const monthOptions = buildMonthOptions(value.anchorMonth);
  const autoRecordAllowed = canAutoRecord(value);
  const autoRecordOn = value.autoRecord === true;

  /** 예상 금액 변경: 양수가 아니게 되면 자동 기록도 함께 끈다(D2 — 이벤트 핸들러에서 처리). */
  const handleAmountChange = (raw: string) => {
    const expectedAmount = parseIntOrUndefined(raw) ?? null;
    const stillAllowed = expectedAmount != null && expectedAmount > 0;
    patch({ expectedAmount, ...(stillAllowed ? {} : { autoRecord: false }) });
  };

  /** 자동 기록 토글: 켤 때 기록자가 비어 있으면 기본 기록자(현재 사용자 → 유일한 멤버)로 채운다. */
  const handleAutoRecordChange = (checked: boolean) => {
    if (!checked) {
      patch({ autoRecord: false });
      return;
    }
    const fallbackPayer =
      value.payerUid ?? defaultPayerUid ?? (payerOptions.length === 1 ? payerOptions[0].uid : null);
    patch({ autoRecord: true, payerUid: fallbackPayer });
  };

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
          <Label className="text-sm font-semibold">정기 발생 알림</Label>
          <p className="text-xs text-muted-foreground">
            설정한 주기의 {occurrenceHint}에 맞춰 기록 알림을 받아요.
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
            <Label className="text-sm">발생 빈도</Label>
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
                시작 월
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
                  <SelectValue placeholder="시작 월" />
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
                이 달부터 {FREQUENCY_OPTIONS.find((o) => o.value === intervalMonths)?.label}로
                반복돼요. 사이 달은 건너뛰어요.
              </p>
            </div>
          )}

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

          {/* 며칠 전 알림 — 자동 기록이 켜지면 기록 완료 알림으로 대체되므로 숨긴다(D8, 값은 보존) */}
          {!autoRecordOn && (
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
          )}

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
                onChange={(e) => handleAmountChange(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">원</span>
            </div>
          </div>

          {/* 발생일 자동 기록 (docs/pages/inner/cashbook-recurring-auto-record.md) */}
          <div
            data-testid="recurrence-auto-record-section"
            className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="recurrence-auto-record-switch" className="text-sm font-semibold">
                  발생일에 자동으로 기록
                </Label>
                <p className="text-xs text-muted-foreground">
                  {autoRecordAllowed
                    ? '매달 금액이 같은 항목에만 켜 주세요. 발생일 아침에 내역이 생기고 알림으로 알려드려요.'
                    : '예상 금액을 입력하면 켤 수 있어요.'}
                </p>
              </div>
              <Switch
                id="recurrence-auto-record-switch"
                data-testid="recurrence-auto-record-switch"
                checked={autoRecordOn}
                disabled={!autoRecordAllowed}
                onCheckedChange={handleAutoRecordChange}
              />
            </div>

            {autoRecordOn && (
              <div className="flex flex-col gap-2">
                {payerOptions.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">기록자</Label>
                    <div className="flex flex-wrap gap-2">
                      {payerOptions.map((opt) => {
                        const selected = value.payerUid === opt.uid;
                        return (
                          <button
                            key={opt.uid}
                            type="button"
                            data-testid={`recurrence-payer-${opt.uid}`}
                            data-selected={selected}
                            className={chipClassName(selected)}
                            onClick={() => patch({ payerUid: opt.uid })}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  발생일이 이미 지났으면 다음 발생일부터 기록돼요. 미리 알림 대신 기록 완료 알림을
                  받아요.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
