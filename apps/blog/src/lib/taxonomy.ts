export const CATEGORIES = {
  'tech-how': {
    label: '기술 구현',
    description: '이걸 어떻게 만들었나',
  },
  'product-how': {
    label: '프로덕트 구현',
    description: '이 기능을 어떻게 풀었나',
  },
  'tech-decision': {
    label: '기술 선택',
    description: '왜 이 스택·구조였나',
  },
  'product-decision': {
    label: '프로덕트 회고',
    description: '사용자에게서 배운 것',
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
  'road-to-fde': {
    title: 'FDE로 가는 길',
  },
} as const;

export type SeriesSlug = keyof typeof SERIES;

export function isSeriesSlug(value: string): value is SeriesSlug {
  return value in SERIES;
}

export function getSeriesTitle(slug: SeriesSlug): string {
  return SERIES[slug].title;
}
