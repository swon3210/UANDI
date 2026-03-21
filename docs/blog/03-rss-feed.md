# 개발 블로그 — 3단계: RSS 피드

## 목적

블로그 글을 RSS 리더로 구독할 수 있도록 `/feed.xml` 엔드포인트를 제공한다.

---

## 선행 조건

- `docs/blog/02-blog-pages.md` 구현 완료
- 글 목록 및 개별 글 페이지가 동작하는 상태

---

## 파일 구조 (이 단계에서 추가)

```
apps/blog/src/app/
└── feed.xml/
    └── route.ts     # RSS 피드 Route Handler
```

---

## 구현 명세

### `feed.xml/route.ts` — Next.js Route Handler

추가 라이브러리 없이 XML 문자열을 직접 생성한다.

```ts
import { getAllPosts } from '@/lib/posts';

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = process.env.SITE_URL ?? 'https://blog.uandi.app';

  const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/posts/${post.slug}</link>
      <description><![CDATA[${post.summary}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${siteUrl}/posts/${post.slug}</guid>
    </item>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>UANDI Dev Blog</title>
    <link>${siteUrl}</link>
    <description>UANDI 서비스를 만들어가는 과정을 기록합니다.</description>
    <language>ko</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
```

### `layout.tsx`에 RSS 링크 추가

```tsx
export const metadata: Metadata = {
  // ...기존 메타데이터
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};
```

---

## 검증 방법

1. `http://localhost:3002/feed.xml` 접근 → 유효한 RSS XML 반환
2. XML에 모든 공개 포스트가 포함되어 있는지 확인
3. draft 포스트는 피드에 미포함 (프로덕션 환경)
4. `Content-Type: application/xml` 헤더 확인
5. RSS 리더 (예: Feedly)에 URL 입력하여 구독 가능한지 확인 (선택)

---

## 관련 문서

- 선행 단계: `docs/blog/02-blog-pages.md`
- 다음 단계: `docs/blog/04-generate-devlog-skill.md`
