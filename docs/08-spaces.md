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

### 💬 커뮤니티 (Community) — 전역 공유 예외

- **목적**: 신혼부부가 모여 신혼 관련 이야기·유머를 함께 보는 **공개 커뮤니티**
- **영역**: 피드(유저 글 + 스크래핑 링크 혼합)
- **소유**: **커플 격리 없음**. 데이터는 `couples/{coupleId}/*`가 아니라 **최상위 `communityPosts/*`** 에 저장되고 모든 로그인 유저에게 공개된다. UANDI 최초의 전역(공유) 공간.
- **라우팅 prefix**: `/community/*`
- **톤**: Violet accent (`hsl(262 52% 55%)`). 우리집(coral)·재테크(indigo)와 구분되는 별도 accent로, "둘만의 프라이빗"이 아닌 공개 공간임을 색으로 표현.
- **접근**: v1은 다른 공간과 동일하게 로그인 + 커플 연결 사용자에게 노출(셸 재사용). 작성자 표시·신고 등 공개 커뮤니티용 장치가 추가된다.
- 상세 명세: `docs/pages/community/community-feed.md`.

> ⚠️ **커플 격리 가정 주의**: 커뮤니티는 기존 두 공간의 커플 격리·요약문서 패턴을 의도적으로 벗어난다. 새 기능을 커뮤니티에 추가할 때 `couples/{coupleId}` 전제를 그대로 적용하지 말 것.

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

- 모든 페이지는 `/inner/*` 또는 `/outer/*` 중 하나에 속한다. 예외: `/community/*`(전역 공유 공간), `/` (대시보드), `/onboarding`, `/auth/*`, `/settings/*`.
- 출시 전이므로 기존 경로(`/inner/photos`, `/inner/cashbook`, `/outer/*`)는 **redirect 없이** 새 경로로 완전 대체한다. 내부 링크·E2E 테스트 경로를 모두 새 prefix 기준으로 갱신한다.
- 페이지 내 모든 내부 링크는 새 prefix 기준으로 작성한다. 기존 경로 사용 금지.

---

## 4. 네비게이션 패턴

실사용 결과 가계부↔갤러리처럼 공간 내·공간 간 페이지를 자주 오가는 패턴이 거의 없어, 상시 화면을 차지하는 BottomNav를 제거하고 **온디맨드 좌측 사이드바**로 네비게이션을 통합한다. 공간 전환(SpaceSwitcher)과 페이지 이동을 한 곳에 모은다.

### AppShell 구조

```
┌─────────────────────────────────┐
│  [☰]            ⚙️  [👤]        │  ← 상단: 메뉴 버튼 + 페이지별 액션
├─────────────────────────────────┤
│                                 │
│        (페이지 본문)            │  ← 하단 고정 네비 없음
│                                 │
└─────────────────────────────────┘

[☰] 탭 → 좌측에서 사이드바 슬라이드 인
┌──────────────┐
│ UANDI        │
│ 우리집        │
│  홈 / 사진 / 가계부 │
│ 재테크        │
│  홈 / 환테크 / 투자 / 적금 │
└──────────────┘
```

### AppSidebar (좌측 드로어)

- 헤더 좌측의 메뉴 버튼(`data-testid="sidebar-trigger"`)으로 연다. overlay-kit + shadcn `Sheet`(side=left) 기반.
- **두 공간을 섹션으로 모두 노출** → 다른 공간으로 이동하려면 그 공간의 항목을 그냥 탭한다. 별도의 공간 전환 컨트롤(SpaceSwitcher)을 두지 않는다.
- 활성 항목은 현재 경로의 가장 긴 prefix 매칭으로 결정하고, 현재 공간 톤(coral/inner · indigo/outer)을 따른다. 사이드바는 포털 밖에 렌더되므로 `data-space`를 SheetContent에 직접 부여한다.
- 항목 클릭 시 사이드바를 닫고 해당 경로로 이동한다.
- 비로그인 / 온보딩 미완 사용자에게는 AppShell 자체가 렌더되지 않으므로 노출되지 않는다.
- 전 뷰포트에서 동일하게 동작한다(기존 BottomNav는 모바일 전용이라 데스크톱에 페이지 네비가 없었음).

### 공간별 항목 구성

| 공간   | 항목                                         |
| ------ | ----------------------------------------------- |
| 우리집 | 홈(`/inner`) · 사진(`/inner/photos`) · 가계부(`/inner/cashbook`) |
| 재테크   | 홈(`/outer`) · 환테크(`/outer/forex`) · 투자(`/outer/investment`) · 적금(`/outer/savings`) |
| 커뮤니티 | 피드(`/community`) |

- 사이드바는 세 공간을 각각 섹션으로 노출한다(우리집 · 재테크 · 커뮤니티).
- 재테크 항목 중 투자·적금은 v1에서 placeholder 페이지로 연결
- 설정/프로필/로그아웃 등은 사이드바 `footer` 슬롯으로 추후 추가 가능(현재 범위 외)

---

## 5. 디자인 톤

- **우리집**: 기존 coral 유지 (`--primary: hsl(4 74% 69%)`). 따뜻함·친밀함.
- **재테크**: Indigo accent (`--primary: hsl(231 48% 48%)`). 차분·신뢰.
- **커뮤니티**: Violet accent (`--primary: hsl(262 52% 55%)`). 공개 공간 정체성.
- **공간 톤 적용 방식**: AppShell이 현재 공간에 따라 root 요소에 `data-space="inner" | "outer" | "community"` 속성을 적용한다. CSS에서 `[data-space='outer'] { --primary: var(--outer-primary); ... }` / `[data-space='community'] { --primary: var(--community-primary); ... }`로 시맨틱 토큰을 일괄 오버라이드해, 하위 컴포넌트는 별도 prop 없이 자동으로 해당 공간 톤을 따른다.
- **로고는 단일 유지**. 공간 정체성은 사이드바의 공간 섹션 라벨·아이콘과 톤 색으로 표현하고, 브랜드 로고 자체는 분기하지 않는다 (브랜드 일관성).
- 헤더 active 색, Button primary, ring 등 시맨틱 토큰을 통해 일괄 적용. 배경·텍스트 등 페이지 골격은 두 공간이 동일하게 유지해 같은 앱임을 명확히 한다.

---

## 6. 출시 범위

### v1 (2026-07 출시)

- 셸·라우팅 마이그레이션 (`/photos`·`/cashbook`·`/investment/*` → `/inner/*`·`/outer/*`)
- 환테크 이주 (`/investment/forex` → `/outer/forex`)
- 재테크 대시보드 (환테크 요약 카드 + 투자/적금 placeholder)
- 디자인 시스템: `AppSidebar`, `Logo variant`, 재테크 accent 토큰
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
   - 사이드바의 해당 공간 섹션에 항목 추가? 대시보드 카드만? 설정 메뉴 안?

이 4개 질문이 정리되지 않으면 구현을 시작하지 않는다.

---

## 관련 문서

- `00-overview.md` — 전체 페이지 구성·기능 범위
- `03-domain-models.md` — Firestore 스키마 (우리집/재테크 소유 분리 적용 예정)
- `02-design-system.md` — `AppSidebar` / Logo variant / 재테크 accent 토큰 (작업 후 반영)
