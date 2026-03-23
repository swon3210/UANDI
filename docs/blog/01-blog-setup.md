# 개발 블로그 — 1단계: 앱 스캐폴딩 + 마크다운 파이프라인

## 목적

UANDI 서비스를 만들어가는 과정을 기록하고 공유하기 위한 **공개 개발 블로그**의 기반을 구축한다.
마크다운 파일을 `content/posts/`에 저장하고, Next.js 정적 생성(SSG)으로 빌드하는 구조를 만든다.

---

## 범위

- `apps/blog/` 앱 생성 (Next.js 15, port 3002)
- `content/posts/` 콘텐츠 디렉토리 생성
- 마크다운 렌더링 파이프라인 (`lib/markdown.ts`)
- 포스트 파일시스템 스캔 + frontmatter 파싱 (`lib/posts.ts`)
- 샘플 포스트 2개 작성
- Turborepo 설정 연동

> 이 단계에서는 **페이지 UI를 만들지 않는다**. 라이브러리 계층까지만 구현하고, 샘플 포스트로 동작을 검증한다.

---

## 콘텐츠 구조

### 디렉토리: `content/posts/` (모노레포 루트)

```
content/
└── posts/
    ├── 2026-03-21-building-photo-gallery.md
    ├── 2026-03-19-weekly-budget-feature.md
    └── ...
```

### 파일명 규칙

`YYYY-MM-DD-slug.md`

- 날짜 prefix로 파일시스템에서 자연스럽게 정렬
- slug 도출: 날짜 prefix 제거 → `building-photo-gallery`

### Frontmatter 스키마

```yaml
---
title: '사진 갤러리 구현 기록'
date: '2026-03-21'
summary: '무한 스크롤과 이미지 프리로딩을 구현한 과정을 정리합니다.'
tags: ['photos', 'performance', 'infinite-scroll']
draft: false
---
본문 마크다운...
```

| 필드      | 타입                  | 필수 | 설명                                             |
| --------- | --------------------- | ---- | ------------------------------------------------ |
| `title`   | `string`              | ✅   | 글 제목                                          |
| `date`    | `string` (YYYY-MM-DD) | ✅   | 작성일                                           |
| `summary` | `string`              | ✅   | 1~2문장 요약 (목록 카드에 표시)                  |
| `tags`    | `string[]`            | ✅   | 분류 태그                                        |
| `draft`   | `boolean`             | ❌   | `true`면 프로덕션 빌드에서 제외 (기본값 `false`) |

---

## TypeScript 타입

```ts
// apps/blog/src/lib/posts.ts

type PostFrontmatter = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft?: boolean;
};

type PostMeta = PostFrontmatter & {
  slug: string;
};

type PostData = PostMeta & {
  content: string; // 렌더링된 HTML
};
```

---

## 앱 스캐폴딩

### `apps/blog/` 파일 구조 (이 단계)

```
apps/blog/
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx       # 최소 레이아웃 (html + body만)
    │   └── page.tsx         # 임시 "블로그 준비 중" 페이지
    └── lib/
        ├── posts.ts         # 파일시스템 스캔 + frontmatter 파싱
        ├── markdown.ts      # unified 파이프라인
        └── utils.ts         # cn() 헬퍼
```

### `package.json`

```json
{
  "name": "blog",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start --port 3002",
    "lint": "next lint"
  },
  "dependencies": {
    "@shikijs/rehype": "^1.29.2",
    "clsx": "^2.1.1",
    "dayjs": "^1.11.0",
    "gray-matter": "^4.0.3",
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "rehype-stringify": "^10.0.0",
    "remark-gfm": "^4.0.1",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.1.1",
    "shiki": "^1.29.2",
    "tailwind-merge": "^2.6.0",
    "unified": "^11.0.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@tailwindcss/typography": "^0.5.16",
    "@types/node": "^22.13.5",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@uandi/tsconfig": "workspace:*",
    "eslint": "^9.21.0",
    "eslint-config-next": "^15.2.0",
    "eslint-config-prettier": "^10.1.8",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.3"
  }
}
```

### `next.config.ts`

```ts
import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // content/posts/ 폴더에 접근하기 위해 모노레포 루트까지 추적 범위 확장
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
```

### `globals.css`

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

@theme {
  --font-sans: 'Pretendard Variable', 'Pretendard', sans-serif;
  --color-primary: #e8837a;
}
```

---

## `lib/posts.ts` — 핵심 라이브러리

`apps/docs-viewer/src/lib/docs.ts` 패턴을 참고하되, `gray-matter`로 frontmatter를 파싱한다.

```ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dayjs from 'dayjs';
import { markdownToHtml } from './markdown';

const POSTS_ROOT = path.join(process.cwd(), '../../content/posts');

// 파일명에서 slug 추출: '2026-03-21-photo-gallery.md' → 'photo-gallery'
function fileNameToSlug(fileName: string): string {
  return fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

// 모든 포스트 메타데이터 (날짜 역순)
export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(POSTS_ROOT).filter(f => f.endsWith('.md'));

  const posts = files.map(fileName => {
    const filePath = path.join(POSTS_ROOT, fileName);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);

    return {
      slug: fileNameToSlug(fileName),
      title: data.title,
      date: data.date,
      summary: data.summary,
      tags: data.tags ?? [],
      draft: data.draft ?? false,
    } as PostMeta;
  });

  // 프로덕션에서는 draft 제외
  const filtered = process.env.NODE_ENV === 'production'
    ? posts.filter(p => !p.draft)
    : posts;

  return filtered.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());
}

// slug로 개별 포스트 조회 (HTML 렌더링 포함)
export async function getPostBySlug(slug: string): Promise<PostData | null> { ... }

// generateStaticParams용
export function getAllSlugs(): string[] { ... }

// 전체 고유 태그 목록
export function getAllTags(): string[] { ... }

// 태그별 필터링
export function getPostsByTag(tag: string): PostMeta[] { ... }
```

---

## `lib/markdown.ts` — 렌더링 파이프라인

`apps/docs-viewer/src/lib/markdown.ts`를 그대로 복사한다.

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
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeShiki, { theme: 'github-light' })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return result.toString();
}
```

---

## Turborepo 설정

### `turbo.json` 수정

blog 앱의 build가 `content/posts/` 변경 시 캐시를 무효화하도록 설정한다.
전체 앱에 영향을 주지 않기 위해, blog 앱 전용 `turbo.json`을 만든다.

```json
// apps/blog/turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "extends": ["//"],
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "../../content/posts/**"]
    }
  }
}
```

### 루트 `package.json` 편의 스크립트

```json
{
  "scripts": {
    "dev:blog": "pnpm --filter blog dev"
  }
}
```

---

## 샘플 포스트

검증을 위해 2개의 샘플 포스트를 작성한다.

### `content/posts/2026-03-19-project-kickoff.md`

```markdown
---
title: 'UANDI 프로젝트를 시작하며'
date: '2026-03-19'
summary: '신혼부부를 위한 사진 + 가계부 앱, UANDI의 첫 발을 내딛다.'
tags: ['project', 'kickoff']
---

## 왜 이 서비스를 만들까

...
```

### `content/posts/2026-03-21-building-photo-gallery.md`

````markdown
---
title: '사진 갤러리 구현 기록'
date: '2026-03-21'
summary: '무한 스크롤과 이미지 프리로딩을 구현한 과정을 정리합니다.'
tags: ['photos', 'performance']
---

## 배경

...

## 코드 예시

```typescript
const photos = usePhotos({ coupleId, folderId });
```
````

---

## 검증 방법

1. `pnpm install` 성공
2. `pnpm --filter blog dev` → 개발 서버 시작 (port 3002)
3. `lib/posts.ts`의 `getAllPosts()` 호출 시 샘플 포스트 2개가 날짜 역순으로 반환
4. `getPostBySlug('building-photo-gallery')` 호출 시 코드 하이라이팅된 HTML 반환
5. `pnpm --filter blog build` → 정적 빌드 성공
6. `pnpm lint` 에러 없음

---

## 관련 문서

- 마크다운 파이프라인 참고: `docs/06-docs-site.md`
- 기술 스택: `docs/01-tech-stack.md`
- 다음 단계: `docs/blog/02-blog-pages.md`
