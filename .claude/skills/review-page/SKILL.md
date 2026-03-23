---
name: review-page
description: 구현된 페이지를 명세와 대조해 감사. 누락 기능, 명세 이탈, 테스트 커버리지 갭을 보고. 코드는 수정하지 않는다.
---

## 역할

이미 구현된 페이지가 명세를 얼마나 충실히 따르는지 감사한다. 코드는 수정하지 않고 보고서만 출력한다.

## 입력

`$ARGUMENTS` — 감사할 페이지 명세 파일 경로 (예: `docs/pages/01-onboarding.md`)

## 실행 순서

### 1단계: 문서 수집

아래 파일을 모두 읽는다 (병렬로).

- `$ARGUMENTS` (페이지 명세)
- `docs/01-tech-stack.md`
- `docs/02-design-system.md`
- `docs/03-domain-models.md`
- `docs/04-auth-flow.md`
- `docs/05-testing-strategy.md`

### 2단계: 구현 파일 탐색

명세의 경로(예: `/onboarding`)를 기반으로 아래 위치를 탐색하고 존재하는 파일을 모두 읽는다.

- `apps/web/src/app/<route>/page.tsx`
- `apps/web/src/app/<route>/` 하위 컴포넌트
- `apps/web/src/components/` 중 해당 페이지에서 사용하는 것
- `apps/web/src/hooks/use<Feature>.ts`
- `apps/web/src/services/<feature>.ts`
- `apps/web/e2e/specs/<route>.spec.ts`
- `apps/web/e2e/page-objects/<Page>Page.ts`

### 3단계: 명세 vs 구현 대조

명세에 정의된 항목을 기준으로 구현 상태를 검사한다. 각 항목을 ✅ 구현됨 / ⚠️ 부분 구현 / ❌ 미구현으로 표시한다.

#### 3-1. UI 상태 (States)

명세에 나열된 모든 UI 상태(로딩, 빈 상태, 에러, 성공 등)가 구현됐는지 확인한다.

#### 3-2. 사용자 흐름 (User Flows)

명세의 각 사용자 여정이 실제 코드 경로로 구현됐는지 추적한다.

#### 3-3. 에러 처리

명세에 정의된 에러 케이스(Firebase 에러, 유효성 검사 등)가 적절히 처리되는지 확인한다.

#### 3-4. 코딩 컨벤션 준수

아래 항목이 `01-tech-stack.md` 컨벤션을 따르는지 확인한다.

- 날짜 처리: `dayjs` 사용 여부 (`date-fns` 금지)
- 오버레이: `overlay-kit` 사용 여부 (직접 `useState`로 Sheet 제어 금지)
- 폼: React Hook Form + Zod + shadcn `<Form>` 패턴 여부
- 전역 상태: Jotai 사용 여부
- 서버 상태: TanStack Query 사용 여부
- 훅 직접 구현: `@uidotdev/usehooks`로 커버되는 훅을 직접 구현했는지
- 디자인 시스템 활용: `@uandi/ui` 컴포넌트(Button, Logo, Header, FullScreenSpinner, EmptyState 등)를 사용해야 할 곳에서 직접 HTML 태그나 인라인 구현을 쓰고 있지 않은지

#### 3-5. 타입 안전성

- `any` 타입 사용 여부
- 명세의 TypeScript 타입과 실제 코드의 타입 일치 여부
- Firestore 접근 시 타입 캐스팅이 도메인 모델과 맞는지

### 4단계: E2E 테스트 커버리지

명세의 테스트 시나리오 목록과 `e2e/specs/*.spec.ts` 파일을 대조한다.

| 명세의 시나리오 | E2E 테스트 존재 여부 |
| --------------- | -------------------- |
| 시나리오 A      | ✅ / ❌              |
| ...             | ...                  |

누락된 시나리오는 별도 목록으로 정리한다.

### 5단계: 수정 권고

감사 결과를 바탕으로 수정이 필요한 항목을 우선순위별로 정리한다.

**🔴 즉시 수정** — 명세 이탈, 타입 불일치, 금지된 패턴 사용
**🟡 보완 권고** — 부분 구현, 누락된 에러 처리, E2E 미커버 시나리오
**🔵 참고** — 코드 스타일 개선, 컨벤션 경미한 이탈

## 출력 형식

```
# /review-page: [페이지명]

## 감사 요약
전체 항목 N개 중 ✅ N / ⚠️ N / ❌ N

## UI 상태 대조
...

## 사용자 흐름 대조
...

## 에러 처리 대조
...

## 코딩 컨벤션
...

## E2E 테스트 커버리지
...

## 수정 권고
...
```

문제가 없는 섹션도 생략하지 않는다. 모든 항목에 근거 (파일명:라인)를 포함한다.
