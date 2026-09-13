# 개발 블로그 — 7단계: 로컬 마크다운 에디터 (/write)

## 목적

`content/posts/`에 마크다운 파일을 손으로 만들지 않고, 브라우저에서 쓰고 바로 확인할 수 있게 한다.
특히 **클립보드 이미지 붙여넣기**를 지원해 스크린샷을 글에 넣는 과정을 없앤다.

블로그는 빌드 시점에 파일을 읽는 정적 사이트다. 따라서 이 에디터는 **로컬 개발 서버 전용**이고,
저장 결과물은 어디까지나 **작업 트리의 파일**이다. 발행은 지금처럼 커밋·푸시로 한다.

---

## 선행 조건

- `docs/blog/01-blog-setup.md` 구현 완료 (`content/posts/`, `lib/posts.ts`, `lib/markdown.ts`)

---

## 파일 구조 (이 단계에서 추가)

```
apps/blog/src/
├── app/
│   ├── write/
│   │   └── page.dev.tsx              # 에디터 페이지 (dev 전용)
│   └── api/write/
│       ├── posts/route.dev.ts        # 목록 조회 · 단건 조회 · 저장
│       ├── preview/route.dev.ts      # 마크다운 → HTML 프리뷰
│       └── images/route.dev.ts       # 붙여넣은 이미지 저장
├── components/write/
│   ├── WriteEditor.tsx               # 상태를 쥐는 컨테이너 (client)
│   ├── WriteFields.tsx               # frontmatter 폼
│   └── WritePreview.tsx              # 렌더 결과 패널
└── lib/write.ts                      # 파일 읽기·쓰기·검증·직렬화 (server)
```

---

## 프로덕션 차단 방식 (이게 이 단계의 핵심)

파일명이 `page.dev.tsx` / `route.dev.ts`인 이유는 **프로덕션 빌드에서 라우트를 아예 만들지 않기 위해서**다.

```ts
// apps/blog/next.config.ts
const devPageExtensions = process.env.NODE_ENV === 'production' ? [] : ['dev.tsx', 'dev.ts'];
pageExtensions: ['tsx', 'ts', ...devPageExtensions],
```

`next build`는 `NODE_ENV=production`으로 돌기 때문에 `.dev.tsx` / `.dev.ts`가 페이지 확장자에서 빠지고,
컴파일 대상에서 통째로 제외된다. 빌드 산출물에 에디터 코드가 남지 않고, `/write`와 `/api/write/*`는 404가 된다.

2차 방어선으로 `lib/write.ts`의 `WRITE_ENABLED`(= `NODE_ENV !== 'production'`)를 페이지·API 모두에서
확인한다. 확장자 설정이 바뀌어도 프로덕션에서는 쓰기 경로가 열리지 않는다.

---

## 구현 명세

### 저장 (`POST /api/write/posts`)

- 파일명은 `<date>-<slug>.md`. 저장 전에 아래를 검증하고, 실패하면 400과 한글 메시지를 돌려준다.
  - `slug`: 영소문자·숫자·하이픈만 (경로 조작 차단을 겸한다)
  - `date`: `YYYY-MM-DD`
  - `title` / `summary`: 비어 있지 않음
  - `category`: `taxonomy.ts`의 `CATEGORY_SLUGS` 중 하나 — **여기서 막지 않으면 블로그 빌드가 throw 한다**
  - `tags`: 1개 이상
  - `series`: 지정했다면 `SERIES`에 등록된 키
- frontmatter는 손으로 쓴 기존 글과 같은 모양(작은따옴표 YAML)으로 직렬화한다.
- 편집 중이던 글의 날짜·slug를 바꿔 저장하면 파일명이 달라진다. 이때 **옛 파일은 지운다** (중복 발행 방지).
- 다른 글이 이미 그 파일명을 쓰고 있으면 덮어쓰지 않고 409로 알린다.

### 이미지 (`POST /api/write/images`)

- `apps/blog/public/images/posts/<slug>/<시각>-<랜덤>.<확장자>`에 저장하고, 본문에 넣을 URL을 돌려준다.
- slug가 아직 없으면 `_inbox/`에 모인다.
- png · jpeg · gif · webp · avif만 허용, 10MB 제한. (svg는 받지 않는다)
- 업로드가 끝날 때까지 본문에는 `![업로드 중…](uploading-xxxx)` 토큰을 넣어두고, 성공하면 실제 URL로 치환한다.
  실패하면 토큰을 지운다.

### 프리뷰 (`POST /api/write/preview`)

- 글 페이지와 **같은** `markdownToHtml`(remark-gfm + rehype-slug + shiki)을 쓴다. 프리뷰와 발행 결과가
  어긋나면 프리뷰를 볼 이유가 없다.
- 입력 중 400ms debounce. `useEffect` 체인 대신 **핸들러 안에서 타이머를 직접 다룬다**
  (`.claude/rules/useeffect-minimize.md`).
- 늦게 도착한 응답이 최신 프리뷰를 덮지 않도록 요청 순번으로 거른다.

---

## 사용법

```bash
pnpm --filter blog dev   # → http://localhost:3002/write
```

- 상단 셀렉트로 기존 글을 열고, `새 글`로 새로 시작한다.
- `⌘S` / `Ctrl+S`로 저장한다. 저장 위치는 툴바에 `content/posts/<파일명>`으로 계속 보인다.
- 본문에 이미지를 **붙여넣거나 끌어다 놓으면** 자동으로 저장되고 마크다운이 삽입된다.
- 저장한 글은 `content/posts/`의 평범한 파일이다. 발행은 커밋·푸시.

---

## 절대 하지 말 것

- 에디터 라우트를 일반 `page.tsx` / `route.ts`로 되돌리기 (프로덕션에 쓰기 경로가 열린다)
- `WRITE_ENABLED` 확인 없이 파일 쓰기 API 추가
- 프리뷰를 별도 마크다운 렌더러로 구현 (발행 결과와 어긋난다)
