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
│  [전체|지출|수입|FLEX]   │  ← 그룹 탭 (기본: 전체)
│  [전체 지출|고정|변동]   │  ← 세부 탭 (지출·수입 탭에서만)
│                         │
│  ┌───────────────────┐  │
│  │ 지출 합계 내역 보기 ›│ │  ← KPI 카드(클릭 시 내역 페이지로 이동)
│  │ 1,370,000원        │  │
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
    - `&type=expense|income|flex` (현재 그룹) → 타입 필터 (합계 카드는 전체 탭에 없으므로 항상 지정됨)
    - 내역 페이지는 최초 렌더에서 한 번만 반영하고 URL에서 파라미터를 제거한다

### 필터 유지 (URL 쿼리, `useDashboardFilters`)

- 기간 단위·기준 기간·그룹·세부 필터·비교 기간·선택 카테고리를 `/inner/cashbook` 쿼리에 저장해 다른 페이지에 다녀와도 유지
  - `period`(weekly 기본 생략), `at`(기준 기간 시작일 `YYYY-MM-DD`, 현재 기간이면 생략), `group`, `sub`, `cmp`(직접 고른 비교 기간), `cat`(비교 대상 카테고리, 반복 키, 빈 값=모두 해제), `donut`(전체 도넛 표시 카테고리, 반복 키)
  - 잘못된 값·미래 날짜는 무시하고 기본값
- 마지막 쿼리를 sessionStorage에도 저장 → 상단 탭·사이드바처럼 쿼리 없는 링크로 돌아와도 같은 필터로 복원
- 필터는 React 상태로 즉시 반영하고 URL은 `router.replace`로 뒤따라 맞춘다 (연속 클릭 유실 방지)

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

- shadcn `Tabs`, 값: `all | expense | income | flex` (기본 `all`)
- 라벨: 전체 / 지출 / 수입 / FLEX
- `data-testid="group-tabs"`
- `entry.type === group`로 필터
- `전체` 탭은 **지출·수입·FLEX 유형별 총량 도넛만** 보여준다 (`byType`, 슬라이스 라벨 지출/수입/FLEX, 색 coral/sage/amber)
  - 합계 KPI 카드·고정/변동 세부 탭·기간 비교 차트는 숨김 (수입·지출 카테고리가 섞이면 의미가 없기 때문)
  - 카테고리별 분석은 지출/수입/FLEX 탭에서

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
- 탭별 비교 대상
  - **지출·수입 `전체`**: 그 그룹 **총액만** 비교 (막대 1줄 `전체 지출`/`전체 수입`). 카테고리 선택 영역 없음. 도넛의 카테고리 선택과 연동하지 않는다
  - **고정/변동 탭**: 선택이 없으면(기본) 그 세부 그룹 총액 1줄(`전체 고정 지출` 등)로 비교, 카테고리를 고르면 고른 카테고리끼리 비교
  - **FLEX**: 기본 현재 기간 금액 상위 3개, 선택 0개면 EmptyState
- 요약(`compare-summary`): 막대와 같은 기준의 현재 기간 / 비교 기간 합계. 카테고리를 고른 경우에만 위에 `선택한 카테고리 N개 합계` 캡션(`compare-summary-caption`)
- 증감(`compare-delta`): `▲/▼ 금액 (비율%)`. 수입은 증가=income 색, 지출·FLEX는 증가=expense 색
  - 연한 배경 띠(`rounded-lg bg-muted/50`)로 감싸고 문구 전체 semibold, 금액은 extrabold
  - 맨 앞 이모지(`compare-delta-emoji`): 좋은 변화(지출·FLEX 감소, 수입 증가)는 😎, 나쁜 변화는 🚨. 변동 없음이면 이모지 없음
- 차트: `recharts BarChart`(가로) — 카테고리당 현재(그룹 시맨틱 색)·비교(회색) 막대 2개, 현재→비교 금액 내림차순
- 막대 금액 라벨은 만원 단위 (`170만원`, `28만원`, 1만 미만은 `5,000원`)
- 비교 대상 카테고리 선택
  - 카드에는 `비교할 카테고리 N개` 개수만 표시하고, 선택된 카테고리는 막대 차트로만 보여준다 (별도 칩 없음 — 추가/제외는 시트에서)
  - `카테고리 선택`(`compare-category-button`) → 바텀시트 `CompareCategorySheet`(`compare-category-sheet`)
    - 상단 검색창(`compare-category-search`, 이름 부분 일치) + 체크 목록(`compare-category-option-{name}`, 색 점 + 이름만 — 금액 비교는 차트에서 하므로 목록엔 표시하지 않음)
    - `전체 해제` / `N개 적용`(`compare-category-apply`). 적용을 눌러야 반영, 그냥 닫으면 변경 없음
    - 상위/하위(2단계) 분류: 카테고리 메타의 `parentCategoryId`로 하위를 상위 아래에 들여써 묶음(`compare-category-group-{상위}`)
      - 상위 행(`compare-category-group-toggle-{상위}`)은 상위 자신(직접 기록된 내역이 있을 때) + 하위 전체를 한 번에 선택/해제, 일부만 선택되면 `partial`(−) 표시
      - 상위에 직접 기록된 내역이 없으면 상위는 묶음 헤더로만 쓰이고 선택 대상(칩·막대)에는 하위만 들어간다
      - 하위가 없는 카테고리는 묶음 없이 단독 항목. 그룹 순서는 금액순 목록에서 처음 등장한 순서
      - 검색: 상위 이름이 맞으면 하위 전체, 하위 이름이 맞으면 상위 헤더 + 일치하는 하위만
    - 열 때 검색창 자동 포커스 안 함 (모바일 키보드가 목록을 가리지 않게)
  - 옵션: 두 기간 중 어느 한쪽에라도 금액이 있는 카테고리 (현재→비교 금액 내림차순)
  - 기본 선택: 지출·수입 고정/변동 탭은 **없음**(총액 비교), FLEX는 현재 기간 금액 상위 **3개** (`DEFAULT_COMPARE_TOP_N`). 개수 제한 없음
  - 선택한 카테고리만 막대로 비교하고, 요약 합계·증감도 같은 선택 기준으로 계산
  - 기간 단위·기준 기간·그룹·세부 필터 변경 시 기본값으로 리셋, 비교 기간만 바꿀 때는 선택 유지
  - 선택 0개면 고정/변동 탭은 총액 1줄, FLEX는 EmptyState ("비교할 카테고리를 선택해주세요")
- 두 기간 모두 내역이 없으면 EmptyState ("비교할 내역이 없어요")
- 비교 기간 데이터는 `useCashbookEntriesInRange`로 별도 범위 쿼리, 로딩 중엔 요약·차트 자리에 Skeleton

### 카테고리 도넛 차트 (`CategoryDonutChart`)

- `recharts PieChart` + shadcn `ChartContainer`, innerRadius로 도넛
- `data-testid="category-donut"`
- 카테고리별 합계 → 도넛 슬라이스
- **지출·수입 `전체` (고정/변동 도넛)**: 기본은 `고정 지출`/`변동 지출`(수입은 `… 수입`) 2조각 (`byFixedVariable`)
  - 카드 상단 `카테고리 선택`(`donut-category-button`) → `CompareCategorySheet`(제목 `표시할 카테고리 선택`, 현재 기간 카테고리, 상위/하위 묶음)
  - 고르면 도넛은 고른 카테고리별 조각, 합계 KPI도 고른 카테고리 합계로 바뀌고 라벨에 `(카테고리 N개)` 표시
  - 전체 해제 후 적용하면 기본(고정/변동)으로. 기간·그룹·세부 필터 변경 시 리셋
- **상위/하위 합산 (`CategoryBreakdown`, 고정/변동 탭·FLEX 탭)**: 하위 카테고리 금액을 상위로 합쳐 상위 하나를 한 슬라이스로 표시 (`byParent`)
  - 하위가 있는 상위는 범례 항목(`category-donut-item-{상위}`)에 `›`, 슬라이스·범례를 누르면 그 상위의 하위 비율 도넛으로 펼침
  - 펼친 화면 상단 `‹ {상위} {합계}`(`category-donut-back`)로 되돌아감
  - 상위에 직접 기록한 금액은 하위 목록에서 `{상위}(기타)`로 구분
  - 기간·그룹·세부 필터가 바뀌면 상위 화면으로 리셋
  - 기간 비교 막대는 이 합산과 무관하게 기록된 카테고리 단위 유지
- 카테고리 메타 `color` 사용, 메타 없으면 fallback palette
- 우측 또는 하단에 범례(라벨+%)
- 빈 데이터 처리:
  - 부모(`BudgetDashboard`)는 그룹 필터 적용 후 entries가 비면 `dashboard-empty` 통합 EmptyState로 차트 영역 전체를 대체한다.
  - 도넛 컴포넌트 자체도 안전망으로 `data=[]` 또는 `total=0`일 때 EmptyState를 표시한다 (재사용 시 보호).

### 합계 KPI 카드

- `data-testid="dashboard-total"`
- 지출/수입/FLEX 탭에서만 표시 (전체 탭엔 없음)
- 선택 그룹(+세부 필터)의 기간 `amount` 합계
- 색상: 지출=expense, 수입=income, FLEX=foreground

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
