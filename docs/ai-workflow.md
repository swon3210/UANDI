# AI 구현 요청 워크플로우

## 개념

이 프로젝트는 두 가지 원칙을 따릅니다.

1. **문서 주도 개발**: 코드보다 문서가 먼저. 명세를 기반으로 구현을 요청합니다.
2. **E2E 테스트 우선(Test-First)**: 기능 구현 전에 E2E 테스트를 먼저 작성합니다.

### 기능 구현 사이클

```
① 페이지 명세 확인 (docs/pages/*.md)
       ↓
② AI에게 E2E 테스트 작성 요청
       ↓
③ 테스트 실행 → 실패 확인 (Red)
       ↓
④ AI에게 기능 구현 요청
       ↓
⑤ 테스트 실행 → 통과 확인 (Green)
       ↓
⑥ 완료
```

기능이 완성됐다는 기준은 **해당 기능의 E2E 테스트가 모두 통과하는 것**입니다.

---

## AI에게 전달해야 할 컨텍스트

### 필수 (항상 포함)

- `docs/00-overview.md`
- `docs/01-tech-stack.md`
- `docs/02-design-system.md`
- `docs/03-domain-models.md`

### 선택 (작업에 따라 포함)

- `docs/04-auth-flow.md` — 인증 관련 작업
- `docs/05-testing-strategy.md` — E2E 테스트 작성 요청 시
- `docs/pages/[해당 페이지].md` — 페이지 관련 작업

---

## 단계별 구현 요청

---

### 단계 1: 모노레포 초기 설정

> 테스트 없음. 개발 환경 세팅 단계입니다.

**프롬프트 템플릿**:

```
아래 문서를 기반으로 Turborepo + pnpm 모노레포를 초기 설정해줘.

[docs/00-overview.md 내용]
[docs/01-tech-stack.md 내용]
[docs/02-design-system.md 내용]

수행할 작업:
1. 루트 package.json (pnpm workspaces 루트), pnpm-workspace.yaml 생성
2. turbo.json 빌드 파이프라인 설정 (build, dev, lint, test:e2e)
3. packages/tsconfig/ 공유 TypeScript 설정 (base.json, nextjs.json)
4. packages/ui/ 초기화
   - package.json (@uandi/ui)
   - components.json (01-tech-stack.md 참고)
   - src/globals.css (02-design-system.md의 CSS 변수 전체)
   - src/index.ts (빈 re-export 파일)
5. apps/web/ Next.js 앱 생성 (TypeScript, TailwindCSS, App Router)
   - @uandi/ui workspace 의존성 추가
   - src/app/globals.css에서 @uandi/ui/globals.css import
   - TanStack Query Provider를 src/app/layout.tsx에 설정
   - src/types/index.ts에 도메인 타입 정의 (03-domain-models.md의 타입 그대로)
   - 01-tech-stack.md의 폴더 구조대로 빈 디렉토리 생성
6. Playwright 설정
   - apps/web에 @playwright/test 설치
   - apps/web/playwright.config.ts (05-testing-strategy.md 참고)
   - apps/web/e2e/ 디렉토리 구조 생성
   - apps/web/.env.test 생성
7. firebase.json에 Auth/Firestore/Storage 에뮬레이터 설정 추가

각 파일을 하나씩 작성해줘. 코드에 대한 부연 설명은 최소화하고 구현에 집중해줘.
```

---

### 단계 1-B: 문서 사이트 (apps/docs) 설정

> 테스트 없음. 모노레포 초기 설정 직후 진행합니다.

**프롬프트 템플릿**:

```
아래 문서를 기반으로 apps/docs 문서 뷰어 사이트를 구현해줘.

[docs/01-tech-stack.md 내용]
[docs/06-docs-site.md 내용]

수행할 작업:
1. apps/docs/ Next.js 프로젝트 초기화 (TypeScript, TailwindCSS, App Router)
2. 필요한 패키지 설치
   (unified, remark-parse, remark-gfm, remark-rehype, rehype-stringify,
    @shikijs/rehype, shiki, rehype-shiki, gray-matter, @tailwindcss/typography)
3. apps/docs/src/lib/nav.ts — 06-docs-site.md의 NAV_ITEMS 그대로 작성
4. apps/docs/src/lib/docs.ts — slug ↔ 파일 경로 변환, 마크다운 파일 읽기
5. apps/docs/src/lib/markdown.ts — remark/rehype 파이프라인 (shiki 하이라이팅)
6. apps/docs/src/app/globals.css — prose 스타일 + 테마 변수
7. apps/docs/src/app/layout.tsx — Sidebar 포함 전체 레이아웃
8. apps/docs/src/app/page.tsx — /overview로 리다이렉트
9. apps/docs/src/app/[...slug]/page.tsx — 동적 라우트, generateStaticParams
10. apps/docs/src/components/Sidebar.tsx — 그룹 네비게이션, 활성 상태 강조
11. apps/docs/src/components/DocContent.tsx — HTML 렌더링, 코드 블록 복사 버튼
12. apps/docs/next.config.ts — outputFileTracingRoot 설정
13. turbo.json에 docs dev/build 파이프라인 추가

06-docs-site.md의 레이아웃 명세와 컴포넌트 명세를 충실히 따라줘.
각 파일을 하나씩 작성해줘.
```

---

### 단계 2: @uandi/ui 컴포넌트 설치

> 테스트 없음. 디자인 시스템 기반 작업 단계입니다.

**프롬프트 템플릿**:

```
아래 문서를 기반으로 @uandi/ui 패키지의 컴포넌트를 구성해줘.

[docs/02-design-system.md 내용]

수행할 작업:
1. packages/ui에서 추가할 shadcn 컴포넌트 명령어 안내
   (button, input, form, dialog, sheet, skeleton, tabs, badge, avatar, sonner, separator)
2. 커스텀 컴포넌트 구현 (packages/ui/src/custom/)
   - Header.tsx — title, leftSlot?, rightSlot? props
   - BottomNav.tsx — activeTab prop ('home' | 'photos' | 'cashbook')
   - EmptyState.tsx — icon, title, description, action? props
3. packages/ui/src/index.ts — 모든 컴포넌트 re-export

02-design-system.md의 Sheet 패턴과 Button variant 매핑을 따라줘.
```

---

### 단계 3: Firebase + 인증

**① E2E 테스트 작성 요청**:

```
아래 문서를 기반으로 인증 & 온보딩 E2E 테스트를 작성해줘.

[docs/04-auth-flow.md 내용]
[docs/05-testing-strategy.md 내용]
[docs/pages/01-onboarding.md 내용]

작성 대상:
- apps/web/e2e/helpers/emulator.ts
- apps/web/e2e/fixtures/auth.fixture.ts
- apps/web/e2e/page-objects/OnboardingPage.ts
- apps/web/e2e/specs/onboarding.spec.ts

테스트 케이스:
- 비로그인 상태로 /photos 진입 시 /으로 리다이렉트된다
- 로그인하고 coupleId가 없으면 /onboarding으로 리다이렉트된다
- '새 커플 공간 만들기'를 누르면 6자리 초대 코드가 표시된다
- 유효한 초대 코드를 입력하면 커플이 연결되고 /으로 이동한다
- 존재하지 않는 초대 코드를 입력하면 에러 메시지가 표시된다
- 만료된 초대 코드를 입력하면 에러 메시지가 표시된다

05-testing-strategy.md의 테스트 케이스 명명 규칙과 POM 패턴을 따라줘.
```

**② 기능 구현 요청** (테스트 실패 확인 후):

```
아래 문서를 기반으로 Firebase 인증 관련 파일을 구현해줘.

[docs/03-domain-models.md 내용]
[docs/04-auth-flow.md 내용]

구현 대상 (apps/web/src/ 하위):
- lib/firebase/config.ts (에뮬레이터 연결 포함)
- lib/firebase/auth.ts
- lib/firebase/firestore.ts (User, Couple 관련 함수)
- stores/auth.store.ts (Jotai)
- hooks/useAuth.ts
- middleware.ts

목표: e2e/specs/onboarding.spec.ts의 모든 테스트가 통과해야 함.
```

---

### 단계 4: 가계부 페이지

**① E2E 테스트 작성 요청**:

```
아래 문서를 기반으로 가계부 E2E 테스트를 작성해줘.

[docs/05-testing-strategy.md 내용]
[docs/pages/04-cashbook.md 내용]

작성 대상:
- apps/web/e2e/page-objects/CashbookPage.ts
- apps/web/e2e/specs/cashbook.spec.ts

테스트 케이스:
- 가계부 페이지 진입 시 이번 달 요약 카드가 표시된다
- 내역이 없을 때 Empty State가 표시된다
- [+] 버튼을 누르면 내역 추가 Sheet가 열린다
- 지출 내역을 추가하면 목록에 표시되고 지출 합계가 증가한다
- 수입 내역을 추가하면 수입 합계가 증가한다
- 금액이 0이면 저장 버튼이 비활성화된다
- 내역을 탭하면 수정 Sheet가 열리고 기존 값이 채워진다
- 내역을 수정하면 목록에 반영된다
- 내역을 삭제하면 목록에서 사라진다
- 이전 달 화살표를 누르면 이전 달 내역이 표시된다

auth.fixture.ts의 authedPage 픽스처를 사용해줘.
05-testing-strategy.md의 POM 패턴과 명명 규칙을 따라줘.
```

**② 기능 구현 요청** (테스트 실패 확인 후):

```
아래 문서를 기반으로 가계부 페이지를 구현해줘.

[docs/02-design-system.md 내용]
[docs/03-domain-models.md 내용]
[docs/pages/04-cashbook.md 내용]

이미 구현된 것:
- apps/web/src/types/index.ts (CashbookEntry 타입)
- @uandi/ui (Button, Input, Form, Sheet, Skeleton, Tabs 등)
- apps/web/src/hooks/useAuth.ts

구현할 파일 (apps/web/src/ 하위):
1. lib/firebase/cashbook.ts
2. hooks/useCashbook.ts (TanStack Query)
3. utils/currency.ts
4. components/cashbook/CashbookSummaryCard.tsx
5. components/cashbook/CashbookEntryItem.tsx
6. components/cashbook/CashbookEntryForm.tsx (Sheet + Form + Zod)
7. app/cashbook/page.tsx

목표: e2e/specs/cashbook.spec.ts의 모든 테스트가 통과해야 함.
폼은 02-design-system.md의 React Hook Form + shadcn Form 패턴을 따라줘.
```

---

### 단계 5: 사진 갤러리 페이지

**① E2E 테스트 작성 요청**:

```
아래 문서를 기반으로 사진 갤러리 E2E 테스트를 작성해줘.

[docs/05-testing-strategy.md 내용]
[docs/pages/03-photo-gallery.md 내용]

작성 대상:
- apps/web/e2e/page-objects/PhotosPage.ts
- apps/web/e2e/specs/photos.spec.ts

테스트 케이스:
- 갤러리 페이지 진입 시 업로드된 사진이 그리드로 표시된다
- 사진이 없을 때 Empty State와 '첫 사진 올리기' 버튼이 표시된다
- [+] 버튼을 누르면 업로드 Sheet가 열린다
- 이미지 파일을 선택하면 미리보기가 표시된다
- 이미지 파일을 선택하지 않으면 업로드 버튼이 비활성화된다
- 사진을 업로드하면 갤러리에 추가된다
- 사진 썸네일을 클릭하면 상세 페이지로 이동한다
- 상세 페이지에서 사진, 촬영일, 캡션이 표시된다
- 상세 페이지에서 삭제하면 갤러리에서 사라진다

auth.fixture.ts의 authedPage 픽스처를 사용해줘.
```

**② 기능 구현 요청** (테스트 실패 확인 후):

```
아래 문서를 기반으로 사진 갤러리 페이지를 구현해줘.

[docs/02-design-system.md 내용]
[docs/03-domain-models.md 내용]
[docs/pages/03-photo-gallery.md 내용]

이미 구현된 것:
- apps/web/src/types/index.ts (Photo 타입)
- @uandi/ui (Button, Sheet, Skeleton 등)
- apps/web/src/hooks/useAuth.ts

구현할 파일 (apps/web/src/ 하위):
1. lib/firebase/photos.ts
2. lib/firebase/storage.ts
3. hooks/usePhotos.ts (TanStack Query + useInfiniteQuery)
4. components/photos/PhotoGrid.tsx
5. components/photos/PhotoUploadForm.tsx (Sheet + Form + Zod)
6. app/photos/page.tsx
7. app/photos/[id]/page.tsx

목표: e2e/specs/photos.spec.ts의 모든 테스트가 통과해야 함.
```

---

### 단계 6: 대시보드

**① E2E 테스트 작성 요청**:

```
아래 문서를 기반으로 대시보드 E2E 테스트를 작성해줘.

[docs/05-testing-strategy.md 내용]
[docs/pages/02-dashboard.md 내용]

작성 대상:
- apps/web/e2e/specs/dashboard.spec.ts

테스트 케이스:
- 비로그인 상태에서 / 접근 시 랜딩 페이지가 표시된다
- 로그인 상태에서 / 접근 시 대시보드가 표시된다
- 최근 사진 3장이 썸네일로 표시된다
- 사진이 없을 때 업로드 유도 버튼이 표시된다
- 이번 달 가계부 요약 카드에 수입/지출/잔액이 표시된다
- '전체 보기' 링크를 누르면 각 페이지로 이동한다
```

**② 기능 구현 요청** (테스트 실패 확인 후):

```
아래 문서를 기반으로 대시보드를 구현해줘.

[docs/pages/02-dashboard.md 내용]

이미 구현된 것:
- apps/web/src/hooks/usePhotos.ts
- apps/web/src/hooks/useCashbook.ts
- @uandi/ui (Skeleton 등)

구현할 파일:
- apps/web/src/app/page.tsx (로그인 상태에 따라 랜딩/대시보드 분기)

목표: e2e/specs/dashboard.spec.ts의 모든 테스트가 통과해야 함.
```

---

## 테스트가 실패할 때

AI에게 다음 형식으로 실패 내용을 전달합니다.

```
아래 테스트가 실패하고 있어. 구현을 수정해줘.

실패한 테스트:
[테스트 파일명 및 케이스명]

Playwright 에러 로그:
[에러 메시지 전체]

현재 구현 코드:
[관련 파일 내용]

테스트가 통과하도록 구현을 수정해줘.
```

---

## 코드 리뷰 요청 템플릿

```
아래 구현된 코드가 명세를 올바르게 따르고 있는지 검토해줘.

검토 기준:
1. 03-domain-models.md의 타입과 일치하는가
2. 02-design-system.md의 CSS 변수, shadcn 컴포넌트, 폼 패턴을 사용하는가
3. 01-tech-stack.md의 코딩 컨벤션과 임포트 순서를 따르는가
4. 폼은 React Hook Form + Zod + shadcn Form 조합을 사용하는가
5. E2E 테스트가 모두 통과하는가

[구현된 코드]
```

---

## 문서-코드 정합성 검사

### 실행 시점

아래 상황에서 정합성 검사를 실행합니다.

- 새 구현 단계 시작 전
- 문서를 크게 수정한 후
- 오랜 기간 중단 후 작업 재개 시

### 프롬프트 템플릿

```
아래 문서와 실제 코드 사이의 불일치를 찾아서 보고해줘.

확인할 문서:
- docs/01-tech-stack.md (폴더 구조, 패키지 목록, 코딩 컨벤션)
- docs/03-domain-models.md (TypeScript 타입 정의)
- docs/04-auth-flow.md (auth.store.ts 코드 예시)
- docs/pages/*.md (각 페이지 기술 명세의 라이브러리/패턴 언급)

확인할 코드:
- apps/web/package.json (실제 설치된 패키지 및 버전)
- apps/web/src/types/index.ts (실제 타입 정의)
- apps/web/src/stores/auth.store.ts (실제 구현)
- apps/web/src/utils/ (실제 유틸 구현)

점검 항목:
1. 문서에 언급된 라이브러리가 실제로 설치되어 있는가
2. 문서에 나온 코드 예시(타입, atom 정의 등)가 실제 구현과 일치하는가
3. 문서의 폴더 구조에 명시된 파일이 실제로 존재하는가
4. CLAUDE.md의 "절대 하지 말 것" 목록에 해당하는 코드가 있는가
   (date-fns 사용, 직접 input 제어, @uidotdev/usehooks로 커버되는 훅 직접 구현 등)

불일치 발견 시: 어떤 문서의 몇 번째 줄과 어떤 파일이 충돌하는지 명시해줘.
일치하는 항목은 생략하고, 문제가 있는 것만 보고해줘.
```

---

## 문서 업데이트 원칙

| 변경 사항            | 순서                                                |
| -------------------- | --------------------------------------------------- |
| 새 기능 추가         | 페이지 `.md` 명세 수정 → E2E 테스트 추가 → 구현     |
| 타입 변경            | `03-domain-models.md` 수정 → 구현 반영              |
| 디자인 변경          | `02-design-system.md` 수정 → 컴포넌트 업데이트      |
| shadcn 컴포넌트 추가 | `packages/ui`에서 CLI로 설치 → `index.ts` re-export |
| 스택 변경            | `01-tech-stack.md`에 변경 이유와 함께 기록          |
