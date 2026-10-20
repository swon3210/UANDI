import type { CashbookEntry } from '@/types';

/** "평소"를 구할 때 보는 기준 달 직전 개월 수 */
export const MEDIAN_WINDOW_MONTHS = 6;
/** 중위값을 믿을 만한 최소 기록 달 수 (1개월이면 전월 비교와 같아 의미가 없다) */
export const MEDIAN_MIN_SAMPLE_MONTHS = 2;
/** 눈에 띄는 카테고리로 볼 평소 대비 배율 (이상/이하) */
export const HIGHLIGHT_HIGH_RATIO = 1.5;
export const HIGHLIGHT_LOW_RATIO = 0.5;
/** 비율이 커도 이 금액보다 작은 차이는 무시한다 (예: 2,000원 → 6,000원) */
export const HIGHLIGHT_MIN_DIFF = 10_000;
/** 카드에 보여줄 눈에 띄는 카테고리 최대 수 (차이 큰 순) */
export const HIGHLIGHT_MAX_COUNT = 4;

export type HighlightKind =
  /** 평소보다 유난히 많이 (중위값 × 1.5 이상) */
  | 'high'
  /** 평소보다 유난히 적게 (중위값 × 0.5 이하, 0원 제외) */
  | 'low'
  /** 평소엔 있었는데 이번 달엔 0원 */
  | 'missing'
  /** 평소(중위값)엔 0원인데 이번 달에 생김 */
  | 'new';

export type CategoryHighlight = {
  category: string;
  kind: HighlightKind;
  /** 이번 달 금액 */
  current: number;
  /** 지난 달들의 월 금액 중위값 */
  median: number;
};

export type MedianComparison = {
  /** 비교에 쓴 직전 개월 수 (창 크기) */
  windowMonths: number;
  /** 그중 실제 기록이 있어 중위값 계산에 들어간 달 수 */
  sampleMonths: number;
  total: {
    current: number;
    median: number;
  };
  /** 평소와의 차이(절댓값) 내림차순, 최대 HIGHLIGHT_MAX_COUNT개 */
  highlights: CategoryHighlight[];
};

/** 정렬 후 가운데 값. 짝수 개면 가운데 두 값의 평균. 빈 배열이면 0. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function sumByCategory(entries: CashbookEntry[]): Map<string, number> {
  const sums = new Map<string, number>();
  for (const e of entries) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
  return sums;
}

function classify(current: number, med: number): HighlightKind | null {
  if (med === 0) return current >= HIGHLIGHT_MIN_DIFF ? 'new' : null;
  if (current === 0) return med >= HIGHLIGHT_MIN_DIFF ? 'missing' : null;
  if (Math.abs(current - med) < HIGHLIGHT_MIN_DIFF) return null;
  if (current >= med * HIGHLIGHT_HIGH_RATIO) return 'high';
  if (current <= med * HIGHLIGHT_LOW_RATIO) return 'low';
  return null;
}

/**
 * 이번 달 내역을 지난 달들의 "평소"(중위값)와 비교한다.
 *
 * - `previousMonths`는 기준 달 직전 달들의 내역 배열(달 단위). 내역이 하나도 없는 달은
 *   아직 기록을 안 한 달로 보고 중위값 계산에서 뺀다.
 * - 카테고리 중위값은 기록이 있는 달 기준으로, 그 달에 그 카테고리가 없으면 0원으로 센다.
 * - 기록 있는 달이 `MEDIAN_MIN_SAMPLE_MONTHS` 미만이면 null (비교 불가).
 *
 * 호출 전에 그룹(지출/수입)·고정/변동 필터를 같은 기준으로 적용해 넘겨야 한다.
 */
export function buildMedianComparison(
  current: CashbookEntry[],
  previousMonths: CashbookEntry[][]
): MedianComparison | null {
  const samples = previousMonths.filter((entries) => entries.length > 0);
  if (samples.length < MEDIAN_MIN_SAMPLE_MONTHS) return null;

  const sampleSums = samples.map(sumByCategory);
  const currentSums = sumByCategory(current);

  const monthTotals = sampleSums.map((sums) => [...sums.values()].reduce((a, b) => a + b, 0));
  const currentTotal = [...currentSums.values()].reduce((a, b) => a + b, 0);

  const categories = new Set<string>(currentSums.keys());
  for (const sums of sampleSums) for (const name of sums.keys()) categories.add(name);

  const highlights: CategoryHighlight[] = [];
  for (const category of categories) {
    const med = median(sampleSums.map((sums) => sums.get(category) ?? 0));
    const cur = currentSums.get(category) ?? 0;
    const kind = classify(cur, med);
    if (kind) highlights.push({ category, kind, current: cur, median: med });
  }
  highlights.sort((a, b) => Math.abs(b.current - b.median) - Math.abs(a.current - a.median));

  return {
    windowMonths: previousMonths.length,
    sampleMonths: samples.length,
    total: { current: currentTotal, median: median(monthTotals) },
    highlights: highlights.slice(0, HIGHLIGHT_MAX_COUNT),
  };
}
