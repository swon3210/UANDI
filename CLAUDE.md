# UANDI — Claude 작업 지침

## 구현 시작 전 필수 문서 읽기

구현 요청을 받으면 **코드 작성 전에 반드시** 아래 순서로 문서를 읽어야 한다.

### 항상 읽기 (모든 구현 작업)

1. `docs/00-overview.md` — 프로젝트 비전, 페이지 구성, MVP 범위
2. `docs/01-tech-stack.md` — 기술 스택, 버전, 폴더 구조, 코딩 컨벤션
3. `docs/02-design-system.md` — CSS 변수, 컴포넌트 카탈로그, 폼 패턴
4. `docs/03-domain-models.md` — TypeScript 타입, Firestore 스키마

### 작업 유형에 따라 추가로 읽기

| 작업            | 추가로 읽을 문서              |
| --------------- | ----------------------------- |
| 인증 / 미들웨어 | `docs/04-auth-flow.md`        |
| E2E 테스트 작성 | `docs/05-testing-strategy.md` |
| 페이지 구현     | `docs/pages/[해당 페이지].md` |
| 문서 뷰어 작업  | `docs/06-docs-site.md`        |

---

## 구현 사이클 (반드시 준수)

```
① 관련 명세 문서 읽기
        ↓
② E2E 테스트 작성
        ↓
③ 테스트 실행 → 실패 확인 (Red)
        ↓
④ 기능 구현
        ↓
⑤ 테스트 실행 → 통과 확인 (Green)
        ↓
⑥ 문서 동기화 (아래 섹션 참고)
```

**기능이 완성됐다는 기준 = 해당 기능의 E2E 테스트가 모두 통과하고, `pnpm lint`에 에러가 없으며, `docs/`가 실제 구현과 일치하는 것.**

---

## 핵심 기술 선택 (임의 변경 금지)

| 항목          | 선택                                    | 금지                       |
| ------------- | --------------------------------------- | -------------------------- |
| 패키지 매니저 | `pnpm`                                  | npm, yarn                  |
| 날짜 처리     | `dayjs`                                 | `date-fns`                 |
| Storybook     | `@storybook/react-vite`                 | `@storybook/nextjs`        |
| 오버레이      | `overlay-kit`                           | 직접 useState로 Sheet 제어 |
| 폼            | React Hook Form + Zod + shadcn `<Form>` | 직접 `<input>` 제어        |
| 전역 상태     | Jotai                                   | Redux, Zustand             |
| 서버 상태     | TanStack Query v5                       | SWR                        |
| 범용 훅       | `@uidotdev/usehooks`                    | 동일 기능 직접 구현        |

### `@uidotdev/usehooks` 사용 규칙

아래 기능이 필요할 때 **직접 구현하지 말고 반드시 이 라이브러리에서 가져올 것**:

| 필요 기능           | 사용할 훅                  |
| ------------------- | -------------------------- |
| 값 debounce         | `useDebounce`              |
| 로컬스토리지 동기화 | `useLocalStorage`          |
| 요소 가시성 감지    | `useIntersectionObserver`  |
| 윈도우 크기         | `useWindowSize`            |
| 클립보드 복사       | `useCopyToClipboard`       |
| 미디어 쿼리         | `useMediaQuery`            |

구현 전 [공식 문서](https://usehooks.com)에서 사용 가능한 훅 목록을 먼저 확인할 것.

---

## 코딩 컨벤션 요약

- **임포트 순서**: React/Next → 외부 라이브러리 → `@uandi/ui` → 내부 경로(`@/`)
- **컴포넌트**: PascalCase 파일명, named export
- **shadcn 파일명**: 소문자 (`button.tsx`) — CLI 기본
- **타입**: `type` 선호 (`interface`는 확장 필요 시만)
- **에러 처리**: Firebase 에러는 훅 내부에서 처리, UI에는 사용자 친화적 메시지만

### 포맷 / 린트 규칙 (Prettier + ESLint)

- **따옴표**: single quote (`'`) 사용
- **세미콜론**: 사용 (`semi: true`)
- **들여쓰기**: 2 spaces
- **줄 길이**: 100자
- **trailing comma**: ES5 (`arrays`, `objects` — 함수 매개변수 제외)
- **미사용 변수**: `warn` — 의도적 미사용은 `_` prefix 사용 (예: `_event`)
- **`any` 타입**: `warn` — 가능하면 구체적 타입 사용
- 코드 작성 후 `pnpm lint` / `pnpm format:check` 실행해 확인

---

## 절대 하지 말 것

- 명세 문서를 읽지 않고 구현 시작
- 명세에 없는 기능을 임의로 추가
- `date-fns` 사용
- `@storybook/nextjs` 사용
- E2E 테스트 없이 기능 구현 완료로 처리
- Radix UI 패키지를 `package.json`에 직접 추가 (shadcn CLI가 자동 처리)
- TailwindCSS v4에서 `@tailwind base/components/utilities` 사용 (`@import "tailwindcss"` 사용)
- `@uidotdev/usehooks`로 커버되는 훅을 직접 구현 (위 목록 참고)

---

## 주요 Gotcha

- `apps/docs-viewer`는 `../../docs/`에 접근하므로 `next.config.ts`에 `outputFileTracingRoot` 필요
- `layout.tsx`에 `<OverlayProvider>` 없으면 overlay-kit 동작 안 함
- shadcn CSS 변수는 HSL 포맷: `--primary: 4 74% 69%` (`hsl()` 래퍼 없음)
- Playwright E2E는 Firebase Local Emulator에서 실행 (프로덕션 데이터 사용 금지)
- 바텀 시트 상단 모서리: `rounded-t-[20px] max-h-[90vh]`

---

## 구현 완료 후 문서 동기화 (⑥단계)

구현이 끝나면 **반드시** 아래 체크리스트를 순서대로 검토하고, 해당하는 항목을 `docs/`에 반영한다.

### 체크리스트

#### 1. 명세와 구현 간 불일치 수정

명세가 "이렇게 만들어라"고 했지만 실제 구현이 다른 방식을 택한 경우, **명세를 실제 구현에 맞게 수정**한다.

| 확인 항목 | 대상 문서 |
| --- | --- |
| 함수/타입 시그니처가 변경됐는가? | `04-auth-flow.md`, `03-domain-models.md` |
| 컴포넌트 구조·파일 위치가 달라졌는가? | `01-tech-stack.md` |
| Firestore 스키마·경로가 바뀌었는가? | `03-domain-models.md` |
| 라우트 보호 방식이 변경됐는가? | `04-auth-flow.md` |

#### 2. 구현 중 발견한 새 내용 추가

명세에 없었지만 구현하며 결정된 사항을 문서에 추가한다.

- 새로운 아키텍처 패턴 (예: 쿠키 기반 미들웨어)
- 새로 발견한 Gotcha (예: `onAuthStateChanged`만으로는 쿠키가 갱신되지 않는 문제)
- 에러 코드 매핑, 상수, 프리셋 등 명세에 빠진 세부 사항

#### 3. 오래된 내용 삭제 또는 교체

더 이상 유효하지 않은 TODO 주석, 이전 API 설명, 폐기된 패턴이 명세에 남아 있으면 제거한다.

#### 4. 페이지 명세 업데이트

`docs/pages/[페이지].md` 작업 시:
- 구현하며 발견한 엣지 케이스를 에러 처리 표에 추가
- 실제로 작성한 E2E 시나리오와 명세의 시나리오 목록이 일치하는지 확인
- 불일치하면 명세를 실제에 맞게 수정

#### 5. docs-viewer 사이드바 동기화

`docs/`의 파일을 추가·삭제·이름 변경한 경우, `apps/docs-viewer/src/lib/nav.ts`의 `NAV_ITEMS`를 반드시 확인한다.

- **새 문서 추가** → 해당 그룹(`기반` 또는 `페이지 명세`)에 `{ title: '...', slug: '...' }` 항목 추가
- **문서 삭제** → `NAV_ITEMS`에서 해당 항목 제거
- **slug 규칙**: 파일명의 숫자 접두사를 제거한 이름. 예: `docs/00-overview.md` → `'overview'`, `docs/pages/00-landing.md` → `'pages/landing'`

> `docs.ts`는 파일시스템을 자동 스캔하므로 URL 접근은 가능하지만, 사이드바 노출은 `nav.ts`에 명시적으로 추가해야 한다.

### 판단 기준

> **명세는 구현의 기준이기도 하지만, 구현 완료 후엔 구현이 정답이다.**
> 구현과 명세가 어긋나면 명세를 수정한다. 단, 의도적 명세 이탈(기술 부채)이라면 TODO로 명시한다.

---

## 구현 요청 워크플로우 상세

`docs/ai-workflow.md` 참고 — 단계별 프롬프트 템플릿과 테스트 실패 시 대응 방법 포함.
