import type { CashbookEntry } from '@/types';

/** AI 파싱에 전달하는 "과거 내역 설명 → 카테고리" 힌트 1건. */
export type CategoryHint = {
  description: string;
  category: string;
};

/** 한 요청에 보내는 힌트 상한. 프롬프트 길이·비용을 묶기 위한 값. */
export const MAX_CATEGORY_HINTS = 100;
/** 힌트 설명 최대 길이. 긴 메모는 앞부분만 쓴다. */
export const MAX_HINT_DESCRIPTION_LEN = 40;

/** 설명을 비교용 키로 정규화한다(공백 축약·소문자). */
function normalizeDescription(description: string): string {
  return description.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, MAX_HINT_DESCRIPTION_LEN);
}

/**
 * 과거 내역에서 "설명 → 카테고리" 힌트를 만든다.
 *
 * - 같은 설명이 여러 번 나오면 **가장 자주 쓰인 카테고리** 하나만 남긴다
 *   (동률이면 최근 것 우선 — entries는 date desc 정렬을 가정).
 * - 설명이 비어 있는 내역은 제외한다.
 * - 자주 등장한 설명부터 MAX_CATEGORY_HINTS개까지 자른다.
 */
export function buildCategoryHints(entries: CashbookEntry[]): CategoryHint[] {
  type Bucket = {
    description: string;
    byCategory: Map<string, number>;
    total: number;
    firstSeen: number;
  };
  const buckets = new Map<string, Bucket>();

  entries.forEach((entry, index) => {
    const key = normalizeDescription(entry.description ?? '');
    if (!key || !entry.category) return;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        description: entry.description.trim().slice(0, MAX_HINT_DESCRIPTION_LEN),
        byCategory: new Map(),
        total: 0,
        firstSeen: index,
      };
      buckets.set(key, bucket);
    }
    bucket.total += 1;
    bucket.byCategory.set(entry.category, (bucket.byCategory.get(entry.category) ?? 0) + 1);
  });

  return [...buckets.values()]
    .sort((a, b) => b.total - a.total || a.firstSeen - b.firstSeen)
    .slice(0, MAX_CATEGORY_HINTS)
    .map((bucket) => {
      // Map은 삽입 순서를 유지하므로(최근 내역이 먼저 삽입됨) 동률일 때 최근 카테고리가 남는다.
      let best = '';
      let bestCount = -1;
      for (const [category, count] of bucket.byCategory) {
        if (count > bestCount) {
          best = category;
          bestCount = count;
        }
      }
      return { description: bucket.description, category: best };
    });
}
