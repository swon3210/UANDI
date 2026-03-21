# 개발 블로그 — 4단계: /generate-devlog 스킬

## 목적

Claude Code에서 `/generate-devlog` 명령으로 현재 대화 컨텍스트를 기반으로 개발 블로그 포스트를 자동 생성한다.
생성된 파일은 `content/posts/`에 `draft: true`로 저장되어, 사용자가 편집 후 커밋한다.

---

## 선행 조건

- `docs/blog/01-blog-setup.md` 구현 완료 (content/posts/ 구조가 존재)
- 블로그 앱이 마크다운 파일을 읽을 수 있는 상태

---

## 파일 구조

```
.claude/skills/generate-devlog/
└── SKILL.md
```

---

## 스킬 명세

### `.claude/skills/generate-devlog/SKILL.md`

````markdown
---
name: generate-devlog
description: 현재 대화 컨텍스트에서 개발 블로그 포스트를 자동 생성합니다.
user_invocable: true
---

## 역할

현재 Claude Code 대화에서 수행한 작업을 분석하고,
개발 블로그 포스트를 `content/posts/` 디렉토리에 마크다운 파일로 생성한다.

## 입력

`$ARGUMENTS` — (선택) 글의 주제나 초점을 지정할 수 있다.
지정하지 않으면 현재 대화 전체를 기반으로 자동 판단한다.

## 실행 순서

### 1단계: 대화 분석

현재 대화에서 다음을 파악한다:

- **무엇을 구현했는가**: 변경된 파일, 추가된 기능, 해결한 문제
- **왜 그렇게 했는가**: 기술적 결정과 그 이유, 대안 비교
- **어떤 어려움이 있었는가**: 만난 버그, 삽질, 예상과 달랐던 점
- **무엇을 배웠는가**: 새로 알게 된 라이브러리, 패턴, 개념

### 2단계: git diff 확인

`git diff HEAD~1` 또는 현재 스테이징된 변경사항을 확인하여
구체적인 코드 변경 내용을 파악한다.

### 3단계: 슬러그 결정

- `$ARGUMENTS`가 있으면 이를 기반으로 영문 slug 생성
- 없으면 구현 내용에서 핵심 키워드를 추출해 slug 생성
- 형식: 소문자 영문 + 하이픈 (예: `photo-gallery-infinite-scroll`)

### 4단계: 마크다운 파일 생성

파일 경로: `content/posts/YYYY-MM-DD-<slug>.md` (오늘 날짜 사용)

파일 내용 구조:

```yaml
---
title: '<한글 제목>'
date: 'YYYY-MM-DD'
summary: '<1~2문장 한글 요약>'
tags: ['<관련 태그들>']
draft: true
---
```
````

본문 구조:

```markdown
## 배경

(이 작업을 하게 된 이유, 해결하려는 문제)

## 구현 내용

(무엇을 만들었는지, 주요 변경사항)
(관련 코드 블록 포함)

## 기술적 결정

(왜 이런 선택을 했는지, 고려한 대안)

## 배운 것

(과정에서 새로 알게 된 점, 삽질 경험)
```

### 5단계: 결과 보고

생성된 파일 경로를 출력하고, 사용자에게 안내한다:

- "파일이 `draft: true`로 생성되었습니다."
- "내용을 검토/편집한 후 `draft: false`로 변경해 주세요."
- "`pnpm --filter blog dev`로 미리보기할 수 있습니다."

## 작성 가이드라인

- **어조**: 개발자가 동료에게 설명하듯 자연스러운 한글
- **코드 블록**: 핵심적인 코드만 포함 (전체 파일 붙여넣기 금지)
- **길이**: 800~1500자 목표 (너무 짧거나 길지 않게)
- **솔직함**: 삽질이나 실수도 포함 — 이것이 개발 일지의 가치
- **태그 선택**: 프로젝트 기능 영역 (photos, cashbook, auth 등) + 기술 키워드 (performance, testing 등)

```

---

## 사용 예시

### 기본 사용

```

/generate-devlog

```

→ 현재 대화에서 수행한 작업을 분석해 자동으로 글 생성

### 주제 지정

```

/generate-devlog 사진 갤러리 무한 스크롤 구현

`````

→ 지정한 주제에 초점을 맞춰 글 생성

---

## 생성 결과 예시

### 파일: `content/posts/2026-03-21-photo-gallery-infinite-scroll.md`

````markdown
---
title: '사진 갤러리에 무한 스크롤 붙이기'
date: '2026-03-21'
summary: 'Intersection Observer와 TanStack Query의 useInfiniteQuery로 사진 무한 스크롤을 구현한 과정.'
tags: ['photos', 'performance', 'infinite-scroll']
draft: true
---

## 배경

사진 갤러리가 한 번에 모든 사진을 불러오면서 초기 로딩이 느려지는 문제가 있었다.
커플이 사진을 수백 장 올리면 페이지가 버벅거릴 게 뻔했다.

## 구현 내용

TanStack Query의 `useInfiniteQuery`와 `@uidotdev/usehooks`의
`useIntersectionObserver`를 조합했다.

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['photos', coupleId, folderId],
  queryFn: ({ pageParam }) => getPhotos({ coupleId, folderId, cursor: pageParam, limit: 20 }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
`````

## 기술적 결정

`react-virtualized` 대신 단순 무한 스크롤을 선택했다. 이유:

- 사진 그리드는 높이가 고정이라 가상화의 이점이 크지 않음
- 한 번에 20개씩 로드하면 DOM 노드 수가 관리 가능한 수준

## 배운 것

`useIntersectionObserver`의 `threshold` 옵션을 0.1로 설정하니
사용자가 스크롤 끝에 도달하기 직전에 다음 페이지를 불러올 수 있었다.
체감 로딩 시간이 거의 없어진다.

```

---

## 왜 자동 트리거가 아닌 수동 호출인가

- 모든 커밋이 블로그 글이 될 필요는 없음
- 사용자가 의미 있는 작업 단위를 판단하여 적절한 시점에 호출
- `draft: true`로 생성 → 편집 → `draft: false` 변경 → 커밋하는 워크플로우가 자연스러움

---

## 검증 방법

1. 기능 구현 대화 중 `/generate-devlog` 실행
2. `content/posts/YYYY-MM-DD-<slug>.md` 파일이 생성되었는지 확인
3. frontmatter 형식이 올바른지 확인 (title, date, summary, tags, draft)
4. 본문이 배경/구현/기술적 결정/배운 것 구조를 따르는지 확인
5. `pnpm --filter blog dev`로 미리보기 (draft 포스트가 개발 환경에서 보이는지)
6. `draft: false`로 변경 후 빌드에 포함되는지 확인

---

## 관련 문서

- 선행 단계: `docs/blog/03-rss-feed.md`
- 기존 스킬 참고: `.claude/skills/plan-page/SKILL.md`
- 블로그 콘텐츠 구조: `docs/blog/01-blog-setup.md`
```
