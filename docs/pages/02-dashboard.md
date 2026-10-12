# 페이지 명세: 대시보드 (/)

## 목적

서비스의 홈 화면. 로그인 전에는 랜딩 페이지, 로그인 후에는 가계부 시각화 대시보드로 동작합니다.

---

## 사용자 스토리

- 커플로서, 우리 가계부의 흐름을 주간/월간/연간으로 한눈에 보고 싶다.
- 커플로서, 카테고리별·유형별(지출/수입/FLEX/투자) 분포를 빠르게 파악하고 싶다.
- 커플로서, 과거 기간의 가계부 추이를 좌우 화살표로 탐색하고 싶다.
- 커플로서, 지출·수입을 고정/변동으로 나눠 따로 보고 싶다.
- 커플로서, 이번 기간을 전월(직전 기간) 또는 내가 고른 기간과 비교하고 싶다.
- 커플로서, 사진 갤러리는 별도 영역에서 진입하고 홈에는 가계부 현황만 보고 싶다.
- 비로그인 방문자로서, 서비스가 어떤 것인지 간단히 파악하고 로그인하고 싶다.

---

## UI 구성

### 비로그인 상태 — 랜딩

```
┌─────────────────────────┐
│                         │
│   UANDI                 │
│                         │
│   둘이서 만드는          │
│   우리만의 일상          │
│                         │
│   사진을 함께 모으고,    │
│   돈을 함께 관리하세요.  │
│                         │
│   ┌───────────────────┐ │
│   │  구글로 시작하기   │ │  ← primary 버튼
│   └───────────────────┘ │
│                         │
└─────────────────────────┘
```

### 로그인 상태 — 가계부 대시보드

```
┌─────────────────────────┐
│  UANDI          [프로필] │  ← Header
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ 🎯 예산 설정     › │  │  ← 진입 카드 → /inner/cashbook/plan/annual
│  └───────────────────┘  │
│                         │
│  [주간] [월간] [연간]    │  ← 기간 선택 (Tabs/ToggleGroup)
│                         │
│  ‹  2026년 5월  ›        │  ← 기간 네비게이터 (현재 기간이면 ›는 disabled)
│                         │
│  [지출|수입|FLEX]        │  ← 그룹 탭 (기본: 지출, 전체 탭 없음)
│  [전체 지출|고정|변동]   │  ← 세부 탭 (지출·수입 탭에서만)
│                         │
│  ┌───────────────────┐  │
│  │ 지출 합계 내역 보기 ›│ │  ← KPI 카드(클릭 시 내역 페이지로 이동)
│  │ 1,370,000원        │  │
│  │ 순잔액 (수입−지출) +830,000원│ ← 그룹과 무관한 기간 순잔액
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  [카테고리 도넛]   │  │  ← 카테고리별 분포 + 범례
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 기간 비교 [9월(전월)▾]│  │  ← 비교 기간 선택 버튼 (기본: 직전 기간)
│  │ [10월 합계][9월 합계] │  │  ← 두 기간 합계
│  │ 9월 대비 ▲ 16만원(13%)│  │  ← 증감
│  │ 비교할 카테고리 3개 [카테고리 선택›]│ ← 바텀시트(검색+목록)로 선택
│  │ (식비 ✕)(교통 ✕)(월세 ✕)│  │  ← 선택된 카테고리만 칩으로 (기본: 상위 3개)
│  │ [카테고리별 2단 막대] │  │  ← 현재(색) vs 비교(회색)
│  └───────────────────┘  │
│                         │
├─────────────────────────┤
│  [홈] [사진] [가계부]   │  ← Bottom Nav
└─────────────────────────┘
```

---

## 기술 명세

### 데이터 페칭

```ts
// 선택 기간(주/월/년)의 가계부 항목을 범위 쿼리로 조회
query(
  collection(db, `couples/${coupleId}/cashbookEntries`),
  where('date', '>=', periodStart),
  where('date', '<=', periodEnd),
  orderBy('date', 'desc')
);
// → 클라이언트에서 그룹/카테고리/시계열 버킷 집계
```

- 카테고리 메타(아이콘/색상)는 `couples/${coupleId}/cashbookCategories` 1회 조회
- 쿼리 키: `['cashbookEntries', coupleId, 'range', start.toISOString(), end.toISOString()]`

> 공간 간 이동은 좌측 사이드바(`AppSidebar`)로 통합되어 있다. 다만 우리집 홈에서 자주 쓰는 영역은 사이드바와 별개로 다음 진입점을 둔다.

### 진입점

- **예산 설정 진입 카드 (`DashboardEntryList`)**
  - 홈 상단에 전폭 가로 카드로 표시 (아이콘 + 레이블 + 설명 + `ChevronRight`)
  - `예산 설정` → `/inner/cashbook/plan/annual` (연간 예산 계획)
  - 항목별 `data-testid="dashboard-entry-{id}"` (예산: `dashboard-entry-budget`)
  - `entries: DashboardEntry[]`를 props로 받는 프레젠테이션 컴포넌트 — 라우트/아이콘/레이블은 `Dashboard`가 주입
- **내역 진입 — 합계 KPI 카드 재사용**
  - 별도 진입 UI를 추가하지 않고, 기존 합계 KPI 카드(`dashboard-total`)를 `next/link`로 감싸 클릭 시 `/inner/cashbook/history`로 이동
  - 카드 우상단에 `내역 보기 ›` 보조 라벨 표시, `data-testid="dashboard-total"` 유지
  - 현재 대시보드의 기간·그룹 상태를 쿼리 파라미터로 넘겨 내역 페이지 초기 필터로 적용
    - 월간: `?year=YYYY&month=M`(0-based) → 내역 페이지 월 모드(월 스테퍼 사용 가능)
    - 주간·연간: `?start=YYYY-MM-DD&end=YYYY-MM-DD` → 내역 페이지 커스텀 기간
    - 항상 `&type=expense|income|flex` (현재 그룹) → 타입 필터
    - 내역 페이지는 최초 렌더에서 한 번만 반영하고 URL에서 파라미터를 제거한다

### 기간 선택기 (`PeriodSelector`)

- shadcn `Tabs` 또는 ToggleGroup, `weekly | monthly | yearly`
- `data-testid="period-selector"`
- 변경 시 cursor를 해당 단위로 정규화: `cursor.startOf(unit)`
- 기본값: `monthly`

### 기간 네비게이터 (`PeriodNavigator`)

- `‹  {라벨}  ›` 형태, `data-testid="period-navigator"`
- 라벨 형식:
  - weekly: `M월 D일 ~ D일`
  - monthly: `YYYY년 M월`
  - yearly: `YYYY년`
- 좌측 화살표(`prev`): cursor를 -1 unit 이동
- 우측 화살표(`next`): cursor를 +1 unit 이동, **현재 기간일 때 disabled** (미래 이동 차단)
- `isCurrentPeriod(period, cursor)`로 판단

### 그룹 탭 (`GroupTabs`)

- shadcn `Tabs`, 값: `expense | income | flex` (기본 `expense`)
- 라벨: 지출 / 수입 / FLEX
- `data-testid="group-tabs"`
- `entry.type === group`로 필터
- `전체` 탭은 두지 않는다: 수입·지출 카테고리가 도넛·비교 차트에 섞여 의미가 없고, 고정/변동 필터도 쓸 수 없기 때문. 전체 탭의 유일한 정보였던 순잔액은 합계 카드 하단에 상시 표시

### 고정/변동 세부 탭 (`SubGroupTabs`)

- 그룹 탭이 `expense` 또는 `income`일 때만 그룹 탭 아래에 표시 (`data-testid="subgroup-tabs"`)
- 값: `all | fixed | variable`, 라벨: `전체 지출 / 고정 지출 / 변동 지출` (수입은 `… 수입`)
- 분류 기준은 엔트리 카테고리(타입+이름)의 `subGroup`
  - 고정: `fixed_expense`, `regular_income`
  - 변동: 그 외 (`variable_common`, `variable_personal`, `irregular_income`)
  - 카테고리 메타에 없는(삭제·이름 변경된) 카테고리는 변동으로 취급
- 합계 KPI·도넛·기간 비교 차트 모두에 적용. KPI 라벨은 `고정 지출 합계`처럼 접두어가 붙는다.
- 그룹 탭을 바꾸면 세부 필터는 `all`(전체 지출/전체 수입)로 리셋

### 기간 비교 차트 (`PeriodCompareChart`)

- `data-testid="period-compare"`, 막대 차트는 `data-testid="trend-chart"`
- 비교 기간 기본값: 직전 기간 (주간=전주, 월간=전월, 연간=전년). 기본값일 땐 버튼에 `(전월)` 같은 보조 라벨 표시
- 비교 기간 선택: 헤더 버튼(`compare-period-button`) → 바텀 시트(`compare-picker-sheet`)에서 `PeriodPicker`로 같은 단위의 기간 선택 (미래 기간 불가)
  - 직전 기간을 다시 고르면 기본값으로 되돌린다
  - 기간 단위 변경·기준 기간 이동 시 비교 기간은 직전 기간으로 리셋
- 요약(`compare-summary`): 현재 기간 / 비교 기간 합계 (그룹·세부 필터 적용, 순잔액은 부호 유지)
- 증감(`compare-delta`): `▲/▼ 금액 (비율%)`. 수입·순잔액은 증가=income 색, 지출·FLEX는 증가=expense 색
- 차트: `recharts BarChart`(가로) — 카테고리당 현재(그룹 시맨틱 색)·비교(회색) 막대 2개, 현재→비교 금액 내림차순
- 비교 대상 카테고리 선택
  - 카드에는 **선택된 카테고리만** 칩(`compare-category-chip-{name}`)으로 표시, 칩의 ✕(`compare-category-remove-{name}`)로 바로 제외
  - `카테고리 선택`(`compare-category-button`) → 바텀시트 `CompareCategorySheet`(`compare-category-sheet`)
    - 상단 검색창(`compare-category-search`, 이름 부분 일치) + 체크 목록(`compare-category-option-{name}`, 색 점 + 이름만 — 금액 비교는 차트에서 하므로 목록엔 표시하지 않음)
    - `전체 해제` / `N개 적용`(`compare-category-apply`). 적용을 눌러야 반영, 그냥 닫으면 변경 없음
    - 열 때 검색창 자동 포커스 안 함 (모바일 키보드가 목록을 가리지 않게)
  - 옵션: 두 기간 중 어느 한쪽에라도 금액이 있는 카테고리 (현재→비교 금액 내림차순)
  - 기본 선택: 현재 기간 금액 상위 **3개** (`DEFAULT_COMPARE_TOP_N`), 개수 제한 없음
  - 선택한 카테고리만 막대로 비교. 요약 합계·증감은 선택과 무관하게 그룹(+세부 필터) 전체 기준
  - 기간 단위·기준 기간·그룹·세부 필터 변경 시 기본값으로 리셋, 비교 기간만 바꿀 때는 선택 유지
  - 선택 0개면 EmptyState ("비교할 카테고리를 선택해주세요")
- 두 기간 모두 내역이 없으면 EmptyState ("비교할 내역이 없어요")
- 비교 기간 데이터는 `useCashbookEntriesInRange`로 별도 범위 쿼리, 로딩 중엔 요약·차트 자리에 Skeleton

### 카테고리 도넛 차트 (`CategoryDonutChart`)

- `recharts PieChart` + shadcn `ChartContainer`, innerRadius로 도넛
- `data-testid="category-donut"`
- 카테고리별 합계 → 도넛 슬라이스
- 카테고리 메타 `color` 사용, 메타 없으면 fallback palette
- 우측 또는 하단에 범례(라벨+%)
- 빈 데이터 처리:
  - 부모(`BudgetDashboard`)는 그룹 필터 적용 후 entries가 비면 `dashboard-empty` 통합 EmptyState로 차트 영역 전체를 대체한다.
  - 도넛 컴포넌트 자체도 안전망으로 `data=[]` 또는 `total=0`일 때 EmptyState를 표시한다 (재사용 시 보호).

### 합계 KPI 카드

- `data-testid="dashboard-total"`
- 선택 그룹(+세부 필터)의 기간 `amount` 합계
- 색상: 지출=expense, 수입=income, FLEX=foreground
- 하단 순잔액 줄(`data-testid="dashboard-net-balance"`): 기간 전체 내역의 수입 − 지출(flex 포함 지출 합산, 내역 페이지와 동일 규칙)
  - 그룹 탭·세부 필터와 무관하게 같은 값, `+`/`-` 부호와 income/expense 색으로 표기

### 로딩 상태

- 차트 영역 각각 `Skeleton`

### 빈 데이터 상태

- 그룹 필터 적용 후 entries가 비면 차트 영역 전체를 `dashboard-empty` 통합 `EmptyState`로 대체한다 ("이 기간엔 내역이 없어요").

---

## 관련 문서

- 가계부 도메인: `03-domain-models.md` → CashbookEntry, CashbookCategory
- 카테고리 분류: `pages/inner/cashbook-categories.md`
- 사진 갤러리: `pages/inner/photo-gallery.md`
- 가계부 상세: `pages/inner/cashbook.md`
