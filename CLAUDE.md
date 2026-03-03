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
```

**기능이 완성됐다는 기준 = 해당 기능의 E2E 테스트가 모두 통과하고, `pnpm lint`에 에러가 없는 것.**

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

## 구현 요청 워크플로우 상세

`docs/ai-workflow.md` 참고 — 단계별 프롬프트 템플릿과 테스트 실패 시 대응 방법 포함.
