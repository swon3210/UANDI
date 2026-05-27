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
      { title: '두 공간 (우리집/재테크)', slug: 'spaces' },
      { title: 'AI 워크플로우', slug: 'ai-workflow' },
      { title: '크롬 익스텐션', slug: 'extension' },
    ],
  },
  {
    group: '공통 페이지',
    items: [
      { title: '랜딩', slug: 'pages/landing' },
      { title: '온보딩', slug: 'pages/onboarding' },
      { title: '진입 대시보드', slug: 'pages/dashboard' },
      { title: 'AI 기능', slug: 'pages/ai-features' },
    ],
  },
  {
    group: '🏠 우리집 페이지',
    items: [
      {
        title: '사진 갤러리',
        slug: 'pages/inner/photo-gallery',
        children: [
          { title: '갤러리 스캐폴드', slug: 'pages/inner/gallery-scaffold' },
          { title: '사진 업로드/상세', slug: 'pages/inner/photo-upload-detail' },
          { title: '필터/선택/이동', slug: 'pages/inner/filter-select-move' },
          { title: '슬라이드쇼', slug: 'pages/inner/slideshow' },
        ],
      },
      {
        title: '가계부',
        slug: 'pages/inner/cashbook',
        children: [
          { title: '카테고리', slug: 'pages/inner/cashbook-categories' },
          { title: '연간 계획', slug: 'pages/inner/cashbook-annual-plan' },
          { title: '월간', slug: 'pages/inner/cashbook-monthly' },
          { title: '주간', slug: 'pages/inner/cashbook-weekly' },
          { title: '알림', slug: 'pages/inner/cashbook-notifications' },
        ],
      },
    ],
  },
  {
    group: '💼 재테크 페이지',
    items: [
      { title: '재테크 대시보드', slug: 'pages/outer/dashboard' },
      { title: '환테크', slug: 'pages/outer/forex' },
      { title: '투자 (v1.1)', slug: 'pages/outer/investment' },
      { title: '적금 (v1.1)', slug: 'pages/outer/savings' },
    ],
  },
];
