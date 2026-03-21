# 개발 블로그 — 2단계: 페이지 구현

## 목적

1단계에서 만든 라이브러리 계층(`lib/posts.ts`, `lib/markdown.ts`) 위에 블로그 UI를 구현한다.
글 목록, 개별 글, 태그 필터 페이지와 필요한 컴포넌트를 만든다.

---

## 선행 조건

- `docs/blog/01-blog-setup.md` 구현 완료
- `lib/posts.ts`의 모든 함수가 동작하는 상태
- 샘플 포스트 2개가 `content/posts/`에 존재

---

## 라우트 구조

| 경로 | 설명 | 생성 방식 |
|------|------|-----------|
| `/` | 글 목록 (최신순, 태그 필터) | SSG |
| `/posts/[slug]` | 개별 글 | SSG (`generateStaticParams`) |
| `/tags/[tag]` | 태그별 필터링 | SSG (`generateStaticParams`) |

---

## 파일 구조 (이 단계에서 추가)

```
apps/blog/src/
├── app/
│   ├── layout.tsx           # 블로그 레이아웃 (헤더 + main)
│   ├── page.tsx             # 글 목록
│   ├── posts/
│   │   └── [slug]/
│   │       └── page.tsx     # 개별 글
│   └── tags/
│       └── [tag]/
│           └── page.tsx     # 태그별 필터
└── components/
    ├── BlogHeader.tsx       # 사이트 헤더
    ├── PostCard.tsx          # 목록용 카드
    ├── PostContent.tsx       # 글 본문 렌더러
    ├── TagBadge.tsx          # 클릭 가능한 태그 뱃지
    └── TagFilter.tsx         # 수평 스크롤 태그 필터 바
```

---

## 레이아웃

### 데스크탑

```
┌────────────────────────────────────────────────┐
│  UANDI Dev Blog                                │  ← BlogHeader (h-14)
├────────────────────────────────────────────────┤
│                                                │
│         max-w-2xl mx-auto                      │
│         (콘텐츠 영역)                           │
│                                                │
└────────────────────────────────────────────────┘
```

- 사이드바 없음 — 심플한 단일 칼럼 레이아웃
- `max-w-2xl` 본문 폭 (읽기 최적화)
- 모바일도 동일 레이아웃 (반응형 패딩만 조정)

### `layout.tsx`

```tsx
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white font-sans antialiased">
        <BlogHeader />
        <main className="mx-auto max-w-2xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

---

## 컴포넌트 명세

### `BlogHeader.tsx`

- 좌측: `UANDI Dev Blog` 텍스트 (클릭 시 `/`로 이동)
- 스타일: `h-14 border-b px-4 flex items-center`
- 브랜드 컬러(`--color-primary`) 사용

### `PostCard.tsx`

글 목록에서 사용하는 카드 컴포넌트.

```
┌─────────────────────────────────────┐
│ 사진 갤러리 구현 기록                │  ← title (text-lg font-semibold)
│ 2026년 3월 21일                     │  ← date (text-sm text-muted)
│                                     │
│ 무한 스크롤과 이미지 프리로딩을      │  ← summary (text-sm)
│ 구현한 과정을 정리합니다.            │
│                                     │
│ [photos] [performance]              │  ← tags (TagBadge)
└─────────────────────────────────────┘
```

- Props: `post: PostMeta`
- 전체 카드가 `/posts/[slug]`로의 링크
- 날짜 포맷: `dayjs(post.date).format('YYYY년 M월 D일')`

### `PostContent.tsx`

`apps/docs-viewer/src/components/DocContent.tsx`를 참고하여 구현.

- `dangerouslySetInnerHTML`로 HTML 렌더링
- `prose prose-neutral max-w-none` 클래스 적용
- 코드 블록에 복사 버튼 추가 (`useEffect`로 `<pre>` 요소에 버튼 삽입)
- 상단에 글 메타데이터 표시:
  - 제목 (`text-3xl font-bold`)
  - 날짜 (`text-sm text-muted`)
  - 태그 목록 (`TagBadge`)

### `TagBadge.tsx`

- Props: `tag: string`, `active?: boolean`
- 클릭 시 `/tags/[tag]`로 이동
- 스타일: 작은 pill 형태, 활성 시 `bg-primary text-white`, 비활성 시 `bg-gray-100 text-gray-600`

### `TagFilter.tsx`

- Props: `tags: string[]`, `activeTag?: string`
- "전체" 버튼 + 각 태그의 `TagBadge` 목록
- 수평 스크롤 가능 (`flex gap-2 overflow-x-auto`)
- "전체" 클릭 시 `/`로, 태그 클릭 시 `/tags/[tag]`로 이동

---

## 페이지 명세

### `/` — 글 목록 (`page.tsx`)

```tsx
export default function BlogHomePage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <TagFilter tags={tags} />
      <div className="mt-6 space-y-8">
        {posts.map(post => <PostCard key={post.slug} post={post} />)}
      </div>
    </>
  );
}
```

- 글이 없을 때: "아직 작성된 글이 없습니다." 메시지

### `/posts/[slug]` — 개별 글

```tsx
export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  return { title: post?.title ?? 'Post Not Found' };
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return <PostContent post={post} />;
}
```

- 하단에 "← 목록으로" 링크

### `/tags/[tag]` — 태그별 필터

```tsx
export async function generateStaticParams() {
  return getAllTags().map(tag => ({ tag }));
}

export default function TagPage({ params }: Props) {
  const posts = getPostsByTag(params.tag);
  const tags = getAllTags();

  return (
    <>
      <TagFilter tags={tags} activeTag={params.tag} />
      <div className="mt-6 space-y-8">
        {posts.map(post => <PostCard key={post.slug} post={post} />)}
      </div>
    </>
  );
}
```

---

## 검증 방법

1. `pnpm --filter blog dev` → 개발 서버 시작
2. `http://localhost:3002/` — 샘플 포스트 2개가 최신순으로 표시
3. 포스트 카드 클릭 → `/posts/[slug]`에서 코드 하이라이팅된 글 렌더링
4. 코드 블록 복사 버튼 동작
5. 태그 뱃지 클릭 → `/tags/[tag]`에서 필터링된 목록 표시
6. "전체" 클릭 → `/`로 돌아옴
7. 존재하지 않는 slug 접근 → 404 페이지
8. `pnpm --filter blog build` → 모든 페이지 정적 생성 성공
9. `pnpm lint` 에러 없음

---

## 관련 문서

- 선행 단계: `docs/blog/01-blog-setup.md`
- 본문 렌더러 참고: `apps/docs-viewer/src/components/DocContent.tsx`
- 디자인 시스템: `docs/02-design-system.md`
- 다음 단계: `docs/blog/03-rss-feed.md`
