# 문서 뷰어 사이트 (apps/docs)

## 목적

`/docs/` 폴더의 마크다운 파일들을 웹 브라우저에서 보기 좋게 렌더링하는 내부 문서 사이트.
프로젝트 명세를 AI에게 전달하거나 팀이 함께 참고할 때 사용합니다.

---

## 기술 스택

| 항목            | 선택                                      | 이유                             |
| --------------- | ----------------------------------------- | -------------------------------- |
| 프레임워크      | Next.js 15 (App Router)                   | 정적 생성(SSG)으로 빌드          |
| 스타일          | TailwindCSS 4                             | 메인 앱과 동일                   |
| 산문 스타일     | `@tailwindcss/typography`                 | `prose` 클래스로 마크다운 가독성 |
| 마크다운 파싱   | `unified` + `remark-parse` + `remark-gfm` | GitHub Flavored Markdown 지원    |
| HTML 변환       | `remark-rehype` + `rehype-stringify`      | remark → rehype 파이프라인       |
| 코드 하이라이팅 | `rehype-shiki` + `shiki`                  | shadcn과 동일한 highlighter      |
| 프론트매터      | `gray-matter`                             | 마크다운 메타데이터 파싱         |
| 공유 패키지     | `@uandi/tsconfig`                         | TypeScript 설정 공유             |

> Firebase, Zustand, TanStack Query는 **불필요** — 순수 정적 사이트입니다.

---

## 파일 → URL 슬러그 변환 규칙

마크다운 파일명의 번호 접두사(`00-`, `01-` 등)를 제거하고 URL 슬러그로 사용합니다.

| 마크다운 파일                    | URL                    |
| -------------------------------- | ---------------------- |
| `docs/00-overview.md`            | `/overview`            |
| `docs/01-tech-stack.md`          | `/tech-stack`          |
| `docs/02-design-system.md`       | `/design-system`       |
| `docs/03-domain-models.md`       | `/domain-models`       |
| `docs/04-auth-flow.md`           | `/auth-flow`           |
| `docs/05-testing-strategy.md`    | `/testing-strategy`    |
| `docs/06-docs-site.md`           | `/docs-site`           |
| `docs/ai-workflow.md`            | `/ai-workflow`         |
| `docs/pages/01-onboarding.md`    | `/pages/onboarding`    |
| `docs/pages/02-dashboard.md`     | `/pages/dashboard`     |
| `docs/pages/03-photo-gallery.md` | `/pages/photo-gallery` |
| `docs/pages/04-cashbook.md`      | `/pages/cashbook`      |

`/` 접근 시 `/overview`로 리다이렉트합니다.

---

## UI 구성

### 데스크탑 레이아웃

````
┌──────────────────────────────────────────────────────────┐
│  UANDI Docs                                     [GitHub] │  ← 상단 바 (h-14)
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│  개요        │  # 기술 스택                              │
│              │                                           │
│  ── 기반 ──  │  ## 모노레포 구성                        │
│  프로젝트    │                                           │
│  기술 스택   │  | 항목  | 선택    | 이유 |              │
│  디자인      │  |-------|---------|------|              │
│  도메인      │  | Turbo | Turborepo | ... |             │
│  인증        │                                           │
│  테스트      │  ```ts                                    │
│  AI 워크플로 │  // 코드 하이라이팅                       │
│              │  const x = 1;                             │
│  ── 페이지 ─ │  ```                                      │
│  온보딩      │                                           │
│  대시보드    │                                           │
│  사진 갤러리 │                                           │
│  가계부      │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
  w-64 고정      flex-1, max-w-3xl, 스크롤
````

### 모바일 레이아웃

```
┌─────────────────────────┐
│  ☰  UANDI Docs          │  ← 상단 바 (햄버거 메뉴)
├─────────────────────────┤
│                         │
│  # 기술 스택            │
│                         │
│  ## 모노레포 구성       │
│  ...                    │
│                         │
└─────────────────────────┘
```

햄버거 버튼 클릭 시 사이드바가 오버레이로 표시됩니다.

---

## 사이드바 네비게이션 구조

사이드바는 **코드에 정적으로 정의**합니다 (파일시스템 자동 탐색 X).
문서가 추가/제거될 때 아래 배열을 함께 업데이트합니다.

```ts
// apps/docs/src/lib/nav.ts
export const NAV_ITEMS = [
  {
    group: '기반',
    items: [
      { title: '프로젝트 개요', slug: 'overview' },
      { title: '기술 스택', slug: 'tech-stack' },
      { title: '디자인 시스템', slug: 'design-system' },
      { title: '도메인 모델', slug: 'domain-models' },
      { title: '인증 플로우', slug: 'auth-flow' },
      { title: '테스트 전략', slug: 'testing-strategy' },
      { title: 'AI 워크플로우', slug: 'ai-workflow' },
      { title: '문서 사이트', slug: 'docs-site' },
    ],
  },
  {
    group: '페이지 명세',
    items: [
      { title: '온보딩', slug: 'pages/onboarding' },
      { title: '대시보드', slug: 'pages/dashboard' },
      { title: '사진 갤러리', slug: 'pages/photo-gallery' },
      { title: '가계부', slug: 'pages/cashbook' },
    ],
  },
] as const;
```

---

## 기술 명세

### 마크다운 파일 접근 경로

`apps/docs/`는 루트 `docs/` 폴더를 아래 경로로 접근합니다.

```ts
// apps/docs/src/lib/docs.ts
import path from 'path';

// apps/docs/ 기준 ../../docs = 모노레포 루트의 docs/
const DOCS_ROOT = path.join(process.cwd(), '../../docs');
```

### `src/lib/docs.ts` — 파일 읽기 & slug 변환

```ts
export type DocMeta = {
  slug: string;       // 'tech-stack', 'pages/onboarding' 등
  title: string;      // 마크다운 첫 번째 H1
  filePath: string;   // 절대 경로
};

// slug → 마크다운 파일 경로 변환
export function slugToFilePath(slug: string[]): string { ... }

// 마크다운 파일 → HTML 변환
export async function getDocBySlug(slug: string[]): Promise<{
  content: string;  // 렌더링된 HTML
  title: string;
} | null> { ... }

// 정적 경로 생성용 (generateStaticParams)
export function getAllSlugs(): string[][] { ... }
```

### `src/lib/markdown.ts` — remark/rehype 파이프라인

```ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm) // 테이블, 체크박스, strikethrough 지원
    .use(remarkRehype)
    .use(rehypeShiki, {
      theme: 'github-light', // 라이트 테마
    })
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}
```

### `src/app/[...slug]/page.tsx` — 동적 페이지

```ts
export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export default async function DocPage({ params }: { params: { slug: string[] } }) {
  const doc = await getDocBySlug(params.slug);
  if (!doc) notFound();

  return (
    <article
      className="prose prose-neutral max-w-none"
      dangerouslySetInnerHTML={{ __html: doc.content }}
    />
  );
}
```

### `next.config.ts` — 파일시스템 접근 허용

```ts
// apps/docs/next.config.ts
const nextConfig = {
  // 루트 docs/ 폴더를 빌드 시 포함
  outputFileTracingRoot: path.join(__dirname, '../../'),
};
```

---

## prose 스타일링

`@tailwindcss/typography`의 `prose` 클래스를 사용하되, 브랜드 컬러에 맞게 커스텀합니다.

```css
/* apps/docs/src/app/globals.css */
@import 'tailwindcss';
@plugin "@tailwindcss/typography";

@theme {
  /* docs 사이트 전용 — @uandi/ui와 별도 */
  --font-sans: 'Pretendard Variable', 'Pretendard', sans-serif;
  --color-background: #fafaf9;
  --color-sidebar: #f5f3f0;
  --color-border: #e8e4e0;
  --color-primary: #e8837a;
}
```

```tsx
// 적용 예시
<article className="prose prose-neutral prose-headings:font-semibold
                    prose-a:text-primary prose-code:text-sm
                    max-w-none px-8 py-10">
```

---

## 컴포넌트 명세

### `Sidebar.tsx`

- `NAV_ITEMS` 배열을 그룹별로 렌더링
- 현재 활성 문서는 `bg-primary/10 text-primary font-medium`으로 강조
- 그룹 제목: `text-xs font-semibold text-muted-foreground uppercase tracking-wider`
- 모바일: `fixed inset-0 z-50 bg-background` 오버레이

### `DocContent.tsx`

- `dangerouslySetInnerHTML`로 HTML 렌더링
- `prose` 클래스 적용
- 코드 블록: shiki 결과물에 복사 버튼 추가

### 상단 바

- 좌측: `UANDI Docs` 텍스트 로고 + 현재 문서 제목 (모바일에서는 햄버거 아이콘)
- 우측: GitHub 링크 (선택)

---

## pnpm 스크립트

### `apps/docs/package.json`

```json
{
  "name": "docs",
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001"
  }
}
```

### 루트에서 실행

```bash
# docs 사이트 개발 서버 (포트 3001)
pnpm --filter docs dev

# 전체 개발 (web + docs 동시)
pnpm dev
```

---

## 관련 문서

- 모노레포 구조: `01-tech-stack.md`
- 이 사이트에서 보여줄 문서들: `docs/` 루트의 모든 마크다운 파일
