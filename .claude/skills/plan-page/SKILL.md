---
name: plan-page
description: 페이지 구현 전 명세 충돌 검사 및 UI 플랜 수립. 페이지 개발을 시작하기 전에 사용.
---

## 역할

구현을 시작하기 **전에** 아래 순서로 분석하고, 결과를 구조화된 보고서로 출력한다. 코드는 작성하지 않는다.

## 입력

`$ARGUMENTS` — 분석할 페이지 명세 파일 경로 (예: `docs/pages/02-dashboard.md`)

## 실행 순서

### 1단계: 문서 수집

아래 파일을 모두 읽는다 (병렬로).

- `$ARGUMENTS` (페이지 명세)
- `docs/00-overview.md`
- `docs/01-tech-stack.md`
- `docs/02-design-system.md`
- `docs/03-domain-models.md`
- `docs/04-auth-flow.md`
- `docs/05-testing-strategy.md`

페이지 명세에서 참조하는 훅, 서비스, 컴포넌트 파일이 있으면 해당 소스 파일도 읽는다.
반드시 `packages/ui/src/index.ts`도 읽어 현재 사용 가능한 디자인 시스템 컴포넌트 목록을 파악한다.

### 2단계: 충돌 검사 (Conflict Check)

다음 항목을 교차 검증하고, 각 항목마다 ✅ / ⚠️ / ❌ 로 상태를 표시한다.

| 검사 항목 | 방법 |
|---|---|
| **타입 일치** | 페이지가 사용하는 필드/타입이 `03-domain-models.md`의 TypeScript 타입과 일치하는지 |
| **Firestore 스키마** | 페이지가 읽고 쓰는 컬렉션·필드가 도메인 모델에 정의돼 있는지 |
| **UI 컴포넌트 가용성** | 페이지가 필요한 컴포넌트가 `@uandi/ui`에 export돼 있는지, 없으면 shadcn add 필요 여부 |
| **인증 가정** | 페이지의 보호 수준(public/authed/couple)이 `04-auth-flow.md`의 미들웨어 설정과 맞는지 |
| **라우팅 일관성** | `00-overview.md`의 페이지 목록과 명세의 경로가 일치하는지 |
| **오버레이 패턴** | Bottom Sheet / Modal 사용 시 `overlay-kit` 패턴을 따르는지 |
| **폼 패턴** | 폼 사용 시 React Hook Form + Zod + shadcn `<Form>` 패턴인지 |

### 3단계: 갭 분석 (Gap Analysis)

구현에 필요하지만 아직 없는 것을 목록으로 정리한다.

- **새로 만들어야 할 파일**: 서비스(`services/`), 훅(`hooks/`), 컴포넌트
- **shadcn 컴포넌트 추가 필요**: `pnpm dlx shadcn@latest add <component>` 명령 포함
- **E2E 픽스처 부족**: `05-testing-strategy.md`에 없는 인증 상태나 시드 데이터
- **Firestore rules 추가 필요**: 페이지가 접근하는 컬렉션에 대한 rules 누락 여부
- **문서 수정 필요**: 명세 자체의 오류나 모호함

### 4단계: UI 플랜

구현할 컴포넌트 트리와 상태 흐름을 설계한다.

**출력 형식:**

```
페이지 컴포넌트 트리
└── PageName (page.tsx)
    ├── Header (from @uandi/ui)
    ├── SomeList
    │   └── SomeItem × n
    └── BottomNav (from @/components/BottomNav)

상태 관리
- 서버 상태: useXxx() — TanStack Query, 어떤 Firestore 쿼리
- 로컬 상태: useState로 관리할 것들
- 오버레이: overlay-kit으로 열 Bottom Sheet / Modal 목록

사용자 흐름
1. 진입 → (조건)
2. 액션 → (결과)
...
```

### 5단계: 구현 체크리스트

TDD 사이클 순서로 할 일 목록을 출력한다.

```
[ ] E2E 테스트 작성
    [ ] 픽스처: <필요한 auth/data fixture>
    [ ] 시나리오: <테스트 시나리오 목록>
[ ] 갭 해소
    [ ] <shadcn add 명령어 등>
    [ ] <새로 만들 서비스/훅>
[ ] 페이지 구현
    [ ] <주요 컴포넌트>
[ ] 검증
    [ ] E2E 테스트 통과
    [ ] pnpm lint 통과
```

## 출력 형식

결과는 아래 섹션 순서로 마크다운으로 출력한다. 문제가 없는 섹션도 생략하지 않는다.

```
# /plan-page: [페이지명]

## 충돌 검사
...

## 갭 분석
...

## UI 플랜
...

## 구현 체크리스트
...
```

충돌(❌)이나 갭이 발견되면 보고서 상단에 **⚠️ 구현 전 해결 필요 항목 N건** 배너를 추가한다.
