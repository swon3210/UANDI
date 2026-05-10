export const CATEGORIES = {
  'tech-how': {
    label: '기술 How',
    description: '기술 구현 노트',
  },
  'product-how': {
    label: '프로덕트 How',
    description: '프로덕트 맥락 안의 기술',
  },
  'tech-decision': {
    label: '기술 의사결정',
    description: '왜 이 스택을 골랐는가',
  },
  'product-decision': {
    label: '프로덕트 의사결정',
    description: '사용자에게 배운 것',
  },
  essay: {
    label: '에세이',
    description: '개발자로서의 생각',
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as CategorySlug[];

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORIES;
}

export function getCategoryLabel(slug: CategorySlug): string {
  return CATEGORIES[slug].label;
}

export const SERIES = {
  'building-uandi': {
    title: '갤러리 & 가계부 만들기',
  },
} as const;

export type SeriesSlug = keyof typeof SERIES;

export function isSeriesSlug(value: string): value is SeriesSlug {
  return value in SERIES;
}

export function getSeriesTitle(slug: SeriesSlug): string {
  return SERIES[slug].title;
}
