import dayjs, { type Dayjs } from 'dayjs';

// 아파트 보유세·양도세 "참고용 추정" (docs/pages/outer/investment.md §2 예상 세금).
// 세부담상한·종부세·필요경비·조정대상지역 중과 등은 반영하지 않은 단순화 모델이다.

/** 공동주택 공시가격 현실화율 가정 — 시세 × 69% ≈ 공시가격 */
export const PUBLIC_PRICE_RATIO = 0.69;

const EOK = 100_000_000;
const MAN = 10_000;

type Bracket = { upTo: number; rate: number; deduction: number };

function progressive(base: number, brackets: Bracket[]): number {
  if (base <= 0) return 0;
  const bracket = brackets.find((b) => base <= b.upTo) ?? brackets[brackets.length - 1];
  return Math.max(0, base * bracket.rate - bracket.deduction);
}

// 재산세 표준세율 (주택)
const PROPERTY_STANDARD: Bracket[] = [
  { upTo: 6000 * MAN, rate: 0.001, deduction: 0 },
  { upTo: 1.5 * EOK, rate: 0.0015, deduction: 30_000 },
  { upTo: 3 * EOK, rate: 0.0025, deduction: 180_000 },
  { upTo: Infinity, rate: 0.004, deduction: 630_000 },
];

// 재산세 1세대 1주택 특례세율 (공시가격 9억 이하)
const PROPERTY_SINGLE_HOME: Bracket[] = [
  { upTo: 6000 * MAN, rate: 0.0005, deduction: 0 },
  { upTo: 1.5 * EOK, rate: 0.001, deduction: 30_000 },
  { upTo: 3 * EOK, rate: 0.002, deduction: 180_000 },
  { upTo: Infinity, rate: 0.0035, deduction: 630_000 },
];

// 양도소득세 기본세율 (누진공제)
const CAPITAL_GAINS: Bracket[] = [
  { upTo: 1400 * MAN, rate: 0.06, deduction: 0 },
  { upTo: 5000 * MAN, rate: 0.15, deduction: 126 * MAN },
  { upTo: 8800 * MAN, rate: 0.24, deduction: 576 * MAN },
  { upTo: 1.5 * EOK, rate: 0.35, deduction: 1544 * MAN },
  { upTo: 3 * EOK, rate: 0.38, deduction: 1994 * MAN },
  { upTo: 5 * EOK, rate: 0.4, deduction: 2594 * MAN },
  { upTo: 10 * EOK, rate: 0.42, deduction: 3594 * MAN },
  { upTo: Infinity, rate: 0.45, deduction: 6594 * MAN },
];

/** 연간 재산세 추정 (재산세 + 도시지역분 + 지방교육세) */
export function estimatePropertyTax(marketPrice: number, isSingleHome: boolean): number {
  if (marketPrice <= 0) return 0;
  const publicPrice = marketPrice * PUBLIC_PRICE_RATIO;
  const fairMarketRatio = isSingleHome
    ? publicPrice <= 3 * EOK
      ? 0.43
      : publicPrice <= 6 * EOK
        ? 0.44
        : 0.45
    : 0.6;
  const taxBase = publicPrice * fairMarketRatio;
  const brackets =
    isSingleHome && publicPrice <= 9 * EOK ? PROPERTY_SINGLE_HOME : PROPERTY_STANDARD;

  const propertyTax = progressive(taxBase, brackets);
  const cityAreaTax = taxBase * 0.0014;
  const localEducationTax = propertyTax * 0.2;
  return Math.round(propertyTax + cityAreaTax + localEducationTax);
}

export type CapitalGainsEstimate = {
  gain: number;
  holdingYears: number;
  /** 1세대 1주택 비과세(양도가 12억 이하, 2년 이상 보유) */
  isExempt: boolean;
  /** 양도세 + 지방소득세 */
  tax: number;
};

/** 지금 매도했을 때의 양도세 추정 */
export function estimateCapitalGainsTax(params: {
  purchasePrice: number;
  salePrice: number;
  purchaseDate: string;
  isSingleHome: boolean;
  today?: Dayjs;
}): CapitalGainsEstimate {
  const { purchasePrice, salePrice, purchaseDate, isSingleHome, today = dayjs() } = params;
  const gain = salePrice - purchasePrice;
  const holdingYears = Math.max(0, today.diff(dayjs(purchaseDate), 'year'));

  if (gain <= 0) return { gain, holdingYears, isExempt: false, tax: 0 };

  let taxableGain = gain;
  let longTermDeductionRate = 0;

  if (isSingleHome && holdingYears >= 2) {
    if (salePrice <= 12 * EOK) return { gain, holdingYears, isExempt: true, tax: 0 };
    // 고가주택: 12억 초과분 비율만 과세, 보유·거주 각 연 4% (거주=보유 가정)
    taxableGain = (gain * (salePrice - 12 * EOK)) / salePrice;
    longTermDeductionRate = holdingYears >= 3 ? Math.min(0.8, 0.08 * holdingYears) : 0;
  } else if (holdingYears >= 3) {
    longTermDeductionRate = Math.min(0.3, 0.02 * holdingYears);
  }

  const taxBase = Math.max(0, taxableGain * (1 - longTermDeductionRate) - 250 * MAN);
  const nationalTax =
    holdingYears < 1
      ? taxBase * 0.7
      : holdingYears < 2
        ? taxBase * 0.6
        : progressive(taxBase, CAPITAL_GAINS);

  return { gain, holdingYears, isExempt: false, tax: Math.round(nationalTax * 1.1) };
}

/** 전용면적(㎡) → 평 (전용 기준) */
export function sqmToPyeong(sqm: number): number {
  return sqm / 3.3058;
}

/** 전용면적으로 대략적인 공급 평형 추정 (전용률 약 75% 가정). 예: 84.99㎡ → 34평형 */
export function estimateSupplyPyeong(exclusiveSqm: number): number {
  return Math.round(sqmToPyeong(exclusiveSqm) / 0.75);
}
