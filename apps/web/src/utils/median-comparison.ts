import type { CashbookEntry } from '@/types';

/** "평소"를 구할 때 보는 기준 달 직전 개월 수 */
export const MEDIAN_WINDOW_MONTHS = 6;
/** 중위값을 믿을 만한 최소 기록 달 수 (1개월이면 전월 비교와 같아 의미가 없다) */
export const MEDIAN_MIN_SAMPLE_MONTHS = 2;
/** 기록 있는 달이 부족해 평소와 비교할 수 없을 때 안내 문구 */
export const MEDIAN_UNAVAILABLE_MESSAGE = `지난달 기록이 ${MEDIAN_MIN_SAMPLE_MONTHS}개월 이상 쌓이면 평소와 비교해 드려요`;

/** 정렬 후 가운데 값. 짝수 개면 가운데 두 값의 평균. 빈 배열이면 0. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 중위값 표본으로 쓸 달. 내역이 하나도 없는 달은 아직 기록을 안 한 달로 보고 뺀다.
 * 표본이 `MEDIAN_MIN_SAMPLE_MONTHS` 미만이면 null (비교 불가).
 *
 * 호출 전에 그룹(지출/수입)·고정/변동 필터를 같은 기준으로 적용해 넘겨야 한다.
 */
export function medianSamples(previousMonths: CashbookEntry[][]): CashbookEntry[][] | null {
  const samples = previousMonths.filter((entries) => entries.length > 0);
  return samples.length < MEDIAN_MIN_SAMPLE_MONTHS ? null : samples;
}

function sumOf(entries: CashbookEntry[], categories: ReadonlySet<string> | null): number {
  return entries.reduce(
    (sum, e) => (categories === null || categories.has(e.category) ? sum + e.amount : sum),
    0
  );
}

/**
 * 고른 카테고리 묶음의 "평소" 금액 = 표본 달마다 묶음 합계를 낸 뒤의 중위값.
 * (카테고리별 중위값을 더한 값과는 다를 수 있다 — 묶음 전체가 평소 얼마였는지를 본다)
 * `categories`가 null이면 전체. 그 달에 해당 카테고리가 없으면 0원으로 센다.
 */
export function selectionMedian(
  samples: CashbookEntry[][],
  categories: readonly string[] | null
): number {
  const set = categories === null ? null : new Set(categories);
  return median(samples.map((entries) => sumOf(entries, set)));
}

/** 표본 달들에 한 번이라도 나온 카테고리별 "평소" 금액 (그 달에 없으면 0원으로 센다) */
export function categoryMedians(samples: CashbookEntry[][]): Map<string, number> {
  const names = new Set<string>();
  for (const entries of samples) for (const e of entries) names.add(e.category);
  const result = new Map<string, number>();
  for (const name of names) result.set(name, selectionMedian(samples, [name]));
  return result;
}
