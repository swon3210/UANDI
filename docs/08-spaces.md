# 두 공간 (우리집 / 재테크)

UANDI는 두 개의 공간으로 나뉜다. 새 페이지·기능·도메인 모델을 설계할 때는 **먼저 어느 공간 소속인지 분류**한 뒤 이 문서의 규칙을 따른다.

---

## 1. 공간 정의

### 🏠 우리집 (Inner)

- **목적**: 신혼부부가 둘만의 일상을 함께 기록·관리하는 공동 공간
- **영역**: 가계부, 갤러리
- **소유**: 커플 공동 — 데이터는 커플 단위로 저장되고 두 사람 모두 동등하게 읽고 쓴다
- **라우팅 prefix**: `/inner/*`
- **톤**: coral primary 유지 (`--primary: 4 74% 69%`)

### 💼 재테크 (Outer)

- **목적**: 가정에 보탬이 될 수익 활동을 각자 운영하고 함께 진척을 본다
- **영역**: 환테크, 투자, 적금
- **소유**: 개인 소유 + 커플 대시보드 합산 — 거래·포지션은 본인만 추가/수정, 합산 결과는 파트너도 본다
- **라우팅 prefix**: `/outer/*`
- **톤**: Indigo accent (`hsl(231 48% 48%)` ≈ `#3F51B5`). 차분·신뢰감으로 우리집의 coral과 명확히 구분.

---

## 2. 데이터 소유 모델

| 측면          | 우리집                                     | 재테크                                                            |
| ------------- | ------------------------------------------ | --------------------------------------------------------------- |
| 저장 위치     | `couples/{coupleId}/<영역>`                | `couples/{coupleId}/sideHustles/{uid}/<영역>`                   |
| 읽기 권한     | 커플 두 멤버                               | 본인만 (원본 거래/포지션)                                       |
| 쓰기 권한     | 커플 두 멤버                               | 본인만                                                          |
| 파트너 가시성 | 동등 — 모든 데이터 그대로 공유             | 합산·요약만 — `couples/{coupleId}/meta/outerSummary` 경유       |

### 위치 컨벤션

재테크 데이터도 `couples/` 하위에 둔다. 단 `sideHustles/{uid}/` 한 단계로 사용자별 격리하고, 격리는 **저장 위치가 아니라 Firestore 보안 규칙**으로 강제한다.

```
couples/{coupleId}/
├── folders/*                   ← 우리집 (커플 공동)
├── photos/*
├── cashbookEntries/*
├── cashbookCategories/*
├── meta/outerSummary           ← 재테크 합산 요약 (커플 공유)
└── sideHustles/{uid}/          ← 재테크 원본 (본인만 접근)
    ├── forexTrades/*           (v1.1)
    ├── forexHoldings/*         (v1.1)
    ├── positions/*             (v1.1)
    └── savings/*               (v1.1)
```

### 규칙

1. **재테크 원본은 반드시 `couples/{coupleId}/sideHustles/{uid}/` 하위에 둔다.** 다른 사용자의 `{uid}` 노드에 접근할 수 없도록 보안 규칙으로 차단한다 (위치 일관성과 프라이버시를 동시에 확보).
2. **합산이 필요하면 요약 문서를 만든다.** 거래/포지션 생성·수정·삭제 시 해당 사용자의 합산 결과를 계산해 `couples/{coupleId}/meta/outerSummary`에 머지한다. 컬렉션 전체 스캔 금지 (CLAUDE.md "Firestore 쿼리 규칙" 참고).
3. **요약 문서 구조 예시**(상세는 `03-domain-models.md` v1.1에서 확정):
   ```ts
   couples/{coupleId}/meta/outerSummary = {
     byUser: {
       [uid]: {
         forex: { realizedPnlKrw: number; updatedAt: Timestamp };
         investment?: { totalValueKrw: number; updatedAt: Timestamp };
         savings?: { totalPrincipalKrw: number; updatedAt: Timestamp };
       };
     };
     combined: {
       totalRealizedPnlKrw: number;
       updatedAt: Timestamp;
     };
   };
   ```
4. **요약 문서 쓰기는 본인 영역만.** `outerSummary.byUser[request.auth.uid]`만 변경 가능하도록 보안 규칙에서 검증한다 (혹은 서버 라우트에서만 머지). 클라이언트가 파트너의 합산 값을 덮어쓸 수 없게 한다.
5. **재테크에서도 "원본은 개인, 합산은 공동"의 경계를 깨지 말 것.** 파트너가 본인 거래 내역 화면을 열 수 없게 하고, 요약 카드만 노출한다.

### 마이그레이션 영향 (v1)

- 환테크는 v1 시점에 **저장하는 거래 데이터가 없다** (차트·전망 표시만). 따라서 환테크 이주는 라우팅·셸 변경만으로 충분하다.
- 투자·적금은 v1에서 placeholder만 두므로 컬렉션 신설 없음. v1.1 진입 시 위 모델로 추가한다.

---

## 3. 라우팅 규칙

- 모든 페이지는 `/inner/*` 또는 `/outer/*` 중 하나에 속한다. 예외: `/` (대시보드), `/onboarding`, `/auth/*`, `/settings/*`.
- 출시 전이므로 기존 경로(`/inner/photos`, `/inner/cashbook`, `/outer/*`)는 **redirect 없이** 새 경로로 완전 대체한다. 내부 링크·E2E 테스트 경로를 모두 새 prefix 기준으로 갱신한다.
- 페이지 내 모든 내부 링크는 새 prefix 기준으로 작성한다. 기존 경로 사용 금지.

---

## 4. 네비게이션 패턴

### AppShell 구조

```
┌─────────────────────────────────┐
│  [🏠 우리집 ▾]   ⚙️  [👤]      │  ← 상단: SpaceSwitcher + 설정/프로필
├─────────────────────────────────┤
│                                 │
│        (페이지 본문)            │
│                                 │
├─────────────────────────────────┤
│  [홈] [사진] [가계부]           │  ← 하단: 공간별 BottomNav
└─────────────────────────────────┘
```

### SpaceSwitcher (상단)

- 현재 공간 라벨 + 아이콘 표시, 탭하면 두 공간 선택 시트 노출
- 공간 전환 시 해당 공간 대시보드(`/inner` 또는 `/outer`)로 이동
- 비로그인 / 온보딩 미완 사용자에게는 노출하지 않음

### BottomNav (공간별)

| 공간   | 탭 구성                                         |
| ------ | ----------------------------------------------- |
| 우리집 | 홈(`/inner`) · 사진(`/inner/photos`) · 가계부(`/inner/cashbook`) |
| 재테크   | 홈(`/outer`) · 환테크(`/outer/forex`) · 투자(`/outer/investment`) · 적금(`/outer/savings`) |

- 재테크 탭 중 투자·적금은 v1에서 placeholder 페이지로 연결
- 탭 활성 색은 해당 공간의 톤 색상 사용

---

## 5. 디자인 톤

- **우리집**: 기존 coral 유지 (`--primary: hsl(4 74% 69%)`). 따뜻함·친밀함.
- **재테크**: Indigo accent (`--primary: hsl(231 48% 48%)`). 차분·신뢰.
- **공간 톤 적용 방식**: AppShell이 현재 공간에 따라 root 요소에 `data-space="inner" | "outer"` 속성을 적용한다. CSS에서 `[data-space='outer'] { --primary: var(--outer-primary); ... }`로 시맨틱 토큰을 일괄 오버라이드해, 하위 컴포넌트는 별도 prop 없이 자동으로 해당 공간 톤을 따른다.
- **로고는 단일 유지**. 공간 정체성은 SpaceSwitcher 라벨·아이콘과 톤 색으로 표현하고, 브랜드 로고 자체는 분기하지 않는다 (브랜드 일관성).
- 헤더 active 색, Button primary, ring 등 시맨틱 토큰을 통해 일괄 적용. 배경·텍스트 등 페이지 골격은 두 공간이 동일하게 유지해 같은 앱임을 명확히 한다.

---

## 6. 출시 범위

### v1 (2026-07 출시)

- 셸·라우팅 마이그레이션 (`/photos`·`/cashbook`·`/investment/*` → `/inner/*`·`/outer/*`)
- 환테크 이주 (`/investment/forex` → `/outer/forex`)
- 재테크 대시보드 (환테크 요약 카드 + 투자/적금 placeholder)
- 디자인 시스템: `SpaceSwitcher`, `Logo variant`, 재테크 accent 토큰
- 랜딩 카피: 두 공간 소개

### v1.1 이후

- 투자 포지션 관리 (`couples/{coupleId}/sideHustles/{uid}/positions/*`)
- 적금 트래커 (`couples/{coupleId}/sideHustles/{uid}/savings/*`)
- 환테크 거래 기록 (`couples/{coupleId}/sideHustles/{uid}/forexTrades/*`, `forexHoldings/*`)
- 재테크 합산 통계 상세 (월별 P&L, 목표 진척률) + `outerSummary` 요약 문서 도입
- 온보딩 마지막 단계에 "재테크 사용 의향" 옵트인

---

## 7. 신규 페이지 분류 체크리스트

새 페이지를 설계할 때 아래 질문에 답한다:

1. **이 페이지의 데이터는 커플이 모두 보고 편집해야 하는가?**
   - 예 → 우리집 (`/inner/*`)
   - 아니오 → 재테크 (`/outer/*`)
2. **거래·포지션 같은 원본 데이터가 있다면 누가 소유하는가?**
   - 커플 공동 → `couples/{coupleId}/<영역>`
   - 개인 → `couples/{coupleId}/sideHustles/{uid}/<영역>`
3. **파트너에게 보여줄 합산이 필요한가?**
   - 필요 → 요약 문서(`couples/{coupleId}/meta/<영역>Summary`) 설계 + 원본 변경 시 함께 머지
   - 불필요 → 본인 화면에만 노출
4. **네비게이션 진입점은?**
   - 해당 공간 BottomNav 탭에 추가? 대시보드 카드만? 설정 메뉴 안?

이 4개 질문이 정리되지 않으면 구현을 시작하지 않는다.

---

## 관련 문서

- `00-overview.md` — 전체 페이지 구성·기능 범위
- `03-domain-models.md` — Firestore 스키마 (우리집/재테크 소유 분리 적용 예정)
- `02-design-system.md` — `SpaceSwitcher` / Logo variant / 재테크 accent 토큰 (작업 후 반영)
