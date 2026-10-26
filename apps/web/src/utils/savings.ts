import dayjs, { type Dayjs } from 'dayjs';
import type { SavingsAccountInput, SavingsTaxType } from '@/types';

// 예적금 계산 (docs/pages/outer/savings.md §계산 규칙).
// 저장된 상품 조건만으로 "오늘까지 납입 원금"과 "만기 예상 수령액"을 매번 계산한다.

export const SAVINGS_TAX_RATES: Record<SavingsTaxType, number> = {
  normal: 0.154,
  preferential: 0.095,
  taxFree: 0,
};

export const SAVINGS_TAX_LABELS: Record<SavingsTaxType, string> = {
  normal: '일반과세 15.4%',
  preferential: '세금우대 9.5%',
  taxFree: '비과세',
};

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export type SavingsTerms = Pick<
  SavingsAccountInput,
  | 'productType'
  | 'interestRate'
  | 'interestMethod'
  | 'startDate'
  | 'maturityDate'
  | 'depositAmount'
  | 'depositCycle'
  | 'depositDay'
  | 'taxType'
>;

export type SavingsProjection = {
  totalPayments: number;
  paidPayments: number;
  /** 오늘까지 납입한 원금 */
  currentPrincipal: number;
  /** 만기까지 납입할 원금 합계 */
  totalPrincipal: number;
  interestBeforeTax: number;
  tax: number;
  /** 만기 예상 수령액(세후) */
  maturityAmount: number;
  /** 만기일 - 오늘 (일). 0 이하이면 만기 */
  daysToMaturity: number;
  isMatured: boolean;
};

function clampDay(month: Dayjs, day: number): Dayjs {
  return month.date(Math.min(Math.max(day, 1), month.daysInMonth()));
}

/** 납입 일정(만기일 전날까지). 1회차는 항상 가입일이다. */
export function buildDepositSchedule(terms: SavingsTerms): Dayjs[] {
  const start = dayjs(terms.startDate).startOf('day');
  const maturity = dayjs(terms.maturityDate).startOf('day');
  if (!start.isValid() || !maturity.isValid() || !maturity.isAfter(start)) return [];

  const dates: Dayjs[] = [start];
  if (terms.productType === 'deposit') return dates;

  // 납입 횟수는 가입 기간(개월/주 수)을 넘지 않는다.
  // 예: 8/15 가입 · 매월 1일 이체 · 12개월 → 8/15, 9/1 … 7/1 (12회). 다음 해 8/1은 13회차라 제외.
  if (terms.depositCycle === 'weekly') {
    const maxCount = Math.max(1, Math.round(maturity.diff(start, 'day') / 7));
    const offset = (terms.depositDay - start.day() + 7) % 7 || 7;
    for (
      let d = start.add(offset, 'day');
      d.isBefore(maturity) && dates.length < maxCount;
      d = d.add(7, 'day')
    ) {
      dates.push(d);
    }
    return dates;
  }

  const maxCount = Math.max(1, Math.round(maturity.diff(start, 'month', true)));
  for (let k = 1; dates.length < maxCount; k++) {
    const d = clampDay(start.startOf('month').add(k, 'month'), terms.depositDay);
    if (!d.isBefore(maturity)) break;
    dates.push(d);
  }
  return dates;
}

export function projectSavings(terms: SavingsTerms, today: Dayjs = dayjs()): SavingsProjection {
  const schedule = buildDepositSchedule(terms);
  const maturity = dayjs(terms.maturityDate).startOf('day');
  const now = today.startOf('day');
  const rate = terms.interestRate / 100;

  const paidPayments = schedule.filter((d) => !d.isAfter(now)).length;
  const interestBeforeTax = schedule.reduce((sum, d) => {
    const days = maturity.diff(d, 'day');
    if (terms.interestMethod === 'compound') {
      return sum + terms.depositAmount * ((1 + rate / 12) ** (days / (365 / 12)) - 1);
    }
    return sum + (terms.depositAmount * rate * days) / 365;
  }, 0);

  const totalPrincipal = terms.depositAmount * schedule.length;
  const interest = Math.floor(interestBeforeTax);
  const tax = Math.floor(interest * SAVINGS_TAX_RATES[terms.taxType]);
  const daysToMaturity = maturity.diff(now, 'day');

  return {
    totalPayments: schedule.length,
    paidPayments,
    currentPrincipal: terms.depositAmount * paidPayments,
    totalPrincipal,
    interestBeforeTax: interest,
    tax,
    maturityAmount: totalPrincipal + interest - tax,
    daysToMaturity,
    isMatured: daysToMaturity <= 0,
  };
}

/** 카드에 표시할 입금 주기 문구. 예: "매월 25일", "매주 월요일", "1회 예치" */
export function describeDepositCycle(
  terms: Pick<SavingsTerms, 'productType' | 'depositCycle' | 'depositDay'>
): string {
  if (terms.productType === 'deposit') return '1회 예치';
  if (terms.depositCycle === 'weekly') return `매주 ${WEEKDAY_LABELS[terms.depositDay] ?? ''}요일`;
  return `매월 ${terms.depositDay}일`;
}
