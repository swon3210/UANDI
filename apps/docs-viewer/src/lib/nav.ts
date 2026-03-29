// 사이드바 네비게이션 구조
// 새 문서 추가 시 아래 배열에 항목을 추가하세요.

export type NavItem = {
  title: string;
  slug: string;
  children?: NavItem[];
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const NAV_ITEMS: NavGroup[] = [
  {
    group: '기반',
    items: [
      { title: '프로젝트 개요', slug: 'overview' },
      { title: '기술 스택', slug: 'tech-stack' },
      { title: '디자인 시스템', slug: 'design-system' },
      { title: '도메인 모델', slug: 'domain-models' },
      { title: '인증 플로우', slug: 'auth-flow' },
      { title: '테스트 전략', slug: 'testing-strategy' },
      { title: '문서 사이트', slug: 'docs-site' },
      { title: 'AI 워크플로우', slug: 'ai-workflow' },
    ],
  },
  {
    group: '페이지 명세',
    items: [
      { title: '랜딩', slug: 'pages/landing' },
      { title: '온보딩', slug: 'pages/onboarding' },
      { title: '대시보드', slug: 'pages/dashboard' },
      {
        title: '사진 갤러리',
        slug: 'pages/photo-gallery',
        children: [
          { title: '갤러리 스캐폴드', slug: 'pages/gallery-scaffold' },
          { title: '사진 업로드/상세', slug: 'pages/photo-upload-detail' },
          { title: '필터/선택/이동', slug: 'pages/filter-select-move' },
          { title: '슬라이드쇼', slug: 'pages/slideshow' },
        ],
      },
      {
        title: '가계부',
        slug: 'pages/cashbook',
        children: [
          { title: '카테고리', slug: 'pages/cashbook-categories' },
          { title: '연간 계획', slug: 'pages/cashbook-annual-plan' },
          { title: '월간', slug: 'pages/cashbook-monthly' },
          { title: '주간', slug: 'pages/cashbook-weekly' },
        ],
      },
      { title: 'AI 기능', slug: 'pages/ai-features' },
    ],
  },
];
