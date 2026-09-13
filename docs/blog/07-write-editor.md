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
│       ├── images/route.dev.ts       # 붙여넣은 이미지 저장
│       ├── spellcheck/route.dev.ts   # 한국어 맞춤법 검사
│       └── drafts/route.dev.ts       # 임시저장 스냅샷 읽기·쓰기·삭제
├── components/write/
│   ├── WriteEditor.tsx               # 상태를 쥐는 컨테이너 (client)
│   ├── WriteFields.tsx               # frontmatter 폼
│   ├── WritePreview.tsx              # 렌더 결과 패널
│   └── SpellCheckPanel.tsx           # 맞춤법 지적 목록
├── lib/spellcheck.ts                 # 검사 대상 텍스트 추출 + hanspell 호출
└── lib/write.ts                      # 파일 읽기·쓰기·검증·직렬화·임시저장 (server)
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

### 맞춤법 검사 (`POST /api/write/spellcheck`)

- `hanspell`(다음·네이버 온라인 검사기)을 쓴다. 다음이 실패하면 네이버로 한 번 더 시도한다.
- **본문이 외부 서비스로 전송된다.** 이 기능이 로컬 전용이어야 하는 또 하나의 이유다.
- 검사 전에 코드 블록·인라인 코드·URL·HTML 태그·줄머리 기호를 **같은 길이의 공백으로 덮는다**
  (`maskUncheckable`). 길이를 보존하므로 검사 결과에서 찾은 위치를 원문 오프셋으로 그대로 쓴다.
  잘라내면 위치가 밀려 엉뚱한 곳을 고치게 된다.
- 타이핑이 2.5초 멈추면 자동 검사한다. 글을 열 때도 한 번 검사한다.
- `고치기`는 해당 위치만 치환하고, 뒤쪽 지적들의 오프셋을 길이 차이만큼 민다. 검사 후 본문이
  바뀌어 위치가 어긋나면 고치지 않고 다시 검사한다.
- 검사기가 응답하지 않으면 502와 함께 패널에 사유를 띄운다. **글쓰기는 막지 않는다.**

### 임시저장 (`/api/write/drafts`)

- 타이핑이 1.2초 멈추면 폼 + 본문 전체를 `apps/blog/.write-drafts/<키>.json`에 스냅샷으로 남긴다.
  키는 새 글이면 `new`, 기존 글이면 그 파일명이다. (`.write-drafts/`는 git에서 제외)
- **정식 `.md`에 자동으로 쓰지 않는다.** 쓰는 중에는 category·slug가 비어 저장이 막히고,
  무엇보다 커밋된 글을 예고 없이 덮어쓰면 안 되기 때문이다.
- 에디터를 다시 열었을 때 임시저장본이 있으면 상단에 배너로 알리고, `이어서 쓰기`를 누를 때만
  적용한다. 기존 글은 파일 내용과 다를 때만 묻는다.
- 정식 저장에 성공하면 그 키의 스냅샷을 지운다. 예약된 자동 저장이 되살리지 않도록 타이머를
  먼저 끄고 지운다.

---

## 사용법

```bash
pnpm --filter blog dev   # → http://localhost:3002/write
```

- 상단 셀렉트로 기존 글을 열고, `새 글`로 새로 시작한다.
- `⌘S` / `Ctrl+S`로 저장한다. 저장 위치는 툴바에 `content/posts/<파일명>`으로 계속 보인다.
- 본문에 이미지를 **붙여넣거나 끌어다 놓으면** 자동으로 저장되고 마크다운이 삽입된다.
- 쓰는 동안 맞춤법을 자동으로 검사해 아래 패널에 띄운다. `고치기` 한 번으로 반영된다.
- 쓰는 동안 1.2초마다 임시저장된다. 툴바에 마지막 임시저장 시각이 보인다.
- 저장한 글은 `content/posts/`의 평범한 파일이다. 발행은 커밋·푸시.

---

## 절대 하지 말 것

- 에디터 라우트를 일반 `page.tsx` / `route.ts`로 되돌리기 (프로덕션에 쓰기 경로가 열린다)
- `WRITE_ENABLED` 확인 없이 파일 쓰기 API 추가
- 프리뷰를 별도 마크다운 렌더러로 구현 (발행 결과와 어긋난다)
- 자동 저장을 `content/posts/`의 `.md`에 직접 쓰기 (커밋된 글을 소리 없이 덮어쓴다)
- 맞춤법 검사에 원문을 그대로 보내기 (코드·URL이 오탈자로 잡히고 위치가 어긋난다)
