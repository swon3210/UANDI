import dayjs, { type Dayjs } from 'dayjs';
import type { CashbookEntryType, CashflowPayday, CashflowPaydayType, PredictionSource } from '@/types';

// 현금흐름 캘린더 순수 계산 유틸 (firebase 비의존 — Storybook/테스트에서 그대로 사용 가능).
// 명세: Spec §9 (결제일·잔액 계산), §4-3 (카드 표시).

/** 캘린더 카드에 표시할 거래 1건. 실거래(actual ✓) 또는 예측(predicted ◇)을 통합 표현. */
export type CashflowTxnKind = 'actual' | 'predicted';

export type CashflowTransaction = {
  id: string;
  kind: CashflowTxnKind;
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: Date;
  /** predicted일 때만: 출처(calendar/auto). */
  source?: PredictionSource;
};

/** 결제일의 구체적 발생 인스턴스(미래 N개월 내 실제 날짜). */
export type PaydayInstance = {
  id: string; // `${paydayId}-${YYYY-MM-DD}`
  paydayId: string;
  label: string;
  type?: CashflowPaydayType;
  date: Date; // 발생일(해당 일자의 시작)
};

/** 결제일 미등록 시 사용하는 주 단위 버킷(§9-1). */
export type WeekBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

/** 카드 경계: endDate(상한일) 기준으로 그 이하 날짜의 거래를 묶는다. */
export type CardBoundary = {
  key: string;
  label: string;
  endDate: Date;
  subLabel?: string;
  /** 결제일 유형(카드 아이콘 표시용). 주 단위 폴백은 미지정. */
  paydayType?: CashflowPaydayType;
};

export type CashflowCardData = {
  key: string;
  label: string;
  subLabel?: string;
  endDate: Date;
  /** 결제일 유형(아이콘/틴트 선택). 주 단위 폴백은 미지정. */
  paydayType?: CashflowPaydayType;
  inflow: number; // 들어올 돈 (income 합)
  outflow: number; // 나갈 돈 (expense + flex 합)
  balance: number; // 남는 돈 (누적)
  isNegative: boolean;
  transactions: CashflowTransaction[];
  /** §7-2 예상 변동지출(있으면 카드에 한 줄 표시). PR5에서 채움. */
  estimatedVariable?: number;
};

/**
 * 결제일별 발생 인스턴스를 from(오늘)부터 months개월 내에서 생성한다.
 * - dayOfMonth가 해당 월 말일보다 크면 말일로 clamp(예: 31일 → 2월 28/29일).
 * - from(당일) 이후(당일 포함)만 포함. 발생일 오름차순 정렬.
 */
export function buildPaydayInstances(
  paydays: CashflowPayday[],
  from: Dayjs,
  months = 3
): PaydayInstance[] {
  if (paydays.length === 0) return [];
  const start = from.startOf('day');
  const end = start.add(months, 'month').endOf('day');
  const out: PaydayInstance[] = [];

  let monthCursor = start.startOf('month');
  while (monthCursor.isBefore(end) || monthCursor.isSame(end, 'month')) {
    for (const p of paydays) {
      const day = Math.min(p.dayOfMonth, monthCursor.daysInMonth());
      const occ = monthCursor.date(day).startOf('day');
      const afterStart = occ.isSame(start, 'day') || occ.isAfter(start);
      const beforeEnd = occ.isBefore(end);
      if (afterStart && beforeEnd) {
        out.push({
          id: `${p.id}-${occ.format('YYYY-MM-DD')}`,
          paydayId: p.id,
          label: p.label,
          type: p.type,
          date: occ.toDate(),
        });
      }
    }
    monthCursor = monthCursor.add(1, 'month');
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** from(오늘)부터 months개월을 주 단위(오늘→이번 주말, 이후 주 단위)로 묶는다(§9-1 폴백). */
export function buildWeeklyBuckets(from: Dayjs, months = 3): WeekBucket[] {
  const start = from.startOf('day');
  const horizonEnd = start.add(months, 'month');
  const out: WeekBucket[] = [];

  let weekStart = start;
  let i = 0;
  while (weekStart.isBefore(horizonEnd)) {
    const weekEnd = weekStart.endOf('week');
    const end = weekEnd.isAfter(horizonEnd) ? horizonEnd : weekEnd;
    out.push({
      key: `week-${i}`,
      label: `${weekStart.format('M월 D일')} ~ ${end.format('M월 D일')}`,
      start: weekStart.startOf('day').toDate(),
      end: end.endOf('day').toDate(),
    });
    weekStart = weekEnd.add(1, 'day').startOf('day');
    i++;
  }

  return out;
}

/** PaydayInstance[] → 카드 경계. 각 결제일 당일을 상한(endDate)으로 본다. */
export function paydayBoundaries(instances: PaydayInstance[]): CardBoundary[] {
  return instances.map((inst) => ({
    key: inst.id,
    label: inst.label,
    endDate: dayjs(inst.date).endOf('day').toDate(),
    subLabel: dayjs(inst.date).format('M월 D일 (ddd)'),
    paydayType: inst.type,
  }));
}

/** WeekBucket[] → 카드 경계. 주의 마지막 날을 상한으로 본다. */
export function weeklyBoundaries(buckets: WeekBucket[]): CardBoundary[] {
  return buckets.map((b) => ({ key: b.key, label: b.label, endDate: b.end }));
}

/**
 * 카드 경계 + 거래 + 현재 보유 현금으로 카드별 들어올/나갈/남는 돈을 누적 계산한다(§9-2).
 * - 각 거래는 endDate가 거래일 이상인 "가장 이른" 카드에 배정된다.
 * - 마지막 카드의 endDate 이후 거래는 표시 구간 밖이라 제외된다.
 * - 남는 돈[i] = (i===0 ? currentCash : 남는 돈[i-1]) + 들어올 돈 - 나갈 돈.
 */
export function buildCashflowCards(
  boundaries: CardBoundary[],
  transactions: CashflowTransaction[],
  currentCash: number,
  opts: { from?: Date; estimatedDailyVariable?: number } = {}
): CashflowCardData[] {
  const sorted = [...boundaries].sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
  const buckets = sorted.map((b) => ({ boundary: b, txns: [] as CashflowTransaction[] }));

  for (const t of transactions) {
    const bucket = buckets.find((b) => t.date.getTime() <= b.boundary.endDate.getTime());
    if (bucket) bucket.txns.push(t);
  }

  const dailyVar = opts.estimatedDailyVariable ?? 0;
  let running = currentCash;
  let prevEnd = opts.from ? opts.from.getTime() : (sorted[0]?.endDate.getTime() ?? 0);

  return buckets.map(({ boundary, txns }) => {
    let inflow = 0;
    let outflow = 0;
    for (const t of txns) {
      if (t.type === 'income') inflow += t.amount;
      else outflow += t.amount; // expense + flex
    }
    running = running + inflow - outflow;

    // §7-2 예상 변동지출 = 일평균 변동지출 × 직전 결제일 이후 경과일수 (표시 전용, 잔액 미반영)
    const spanDays = Math.max(1, Math.round((boundary.endDate.getTime() - prevEnd) / 86400000));
    prevEnd = boundary.endDate.getTime();
    const estimatedVariable = dailyVar > 0 ? Math.round(dailyVar * spanDays) : undefined;

    return {
      key: boundary.key,
      label: boundary.label,
      subLabel: boundary.subLabel,
      paydayType: boundary.paydayType,
      endDate: boundary.endDate,
      inflow,
      outflow,
      balance: running,
      isNegative: running < 0,
      transactions: [...txns].sort((a, b) => a.date.getTime() - b.date.getTime()),
      estimatedVariable,
    };
  });
}

/** 가장 이른(다음) 잔액 음수 카드. 없으면 null(§10 음수 경고 배너용). */
export function firstNegativeCard(cards: CashflowCardData[]): CashflowCardData | null {
  return cards.find((c) => c.isNegative) ?? null;
}
