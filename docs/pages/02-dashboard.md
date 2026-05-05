# 페이지 명세: 대시보드 (/)

## 목적

서비스의 홈 화면. 로그인 전에는 랜딩 페이지, 로그인 후에는 가계부 시각화 대시보드로 동작합니다.

---

## 사용자 스토리

- 커플로서, 우리 가계부의 흐름을 주간/월간/연간으로 한눈에 보고 싶다.
- 커플로서, 카테고리별·유형별(지출/수입/FLEX/투자) 분포를 빠르게 파악하고 싶다.
- 커플로서, 과거 기간의 가계부 추이를 좌우 화살표로 탐색하고 싶다.
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
│  [🖼 사진 갤러리][📒 가계부]│  ← 상단 진입 버튼 2개 (2-column grid)
│                         │
│  [주간] [월간] [연간]    │  ← 기간 선택 (Tabs/ToggleGroup)
│                         │
│  ‹  2026년 5월  ›        │  ← 기간 네비게이터 (현재 기간이면 ›는 disabled)
│                         │
│  [전체|지출|수입|FLEX|투자]│  ← 그룹 탭
│                         │
│  ┌───────────────────┐  │
│  │ 합계 -1,230,000원  │  │  ← KPI 카드 (선택 그룹의 기간 총합)
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ [카테고리 칩 멀티셀] │  │  ← 비교할 카테고리 선택 (max 5)
│  │  [시계열 다중 라인] │  │  ← 카테고리당 라인 1개, 추이 비교
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  [카테고리 도넛]   │  │  ← 카테고리별 분포 + 범례
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

### 상단 진입 버튼 (`EntryButtons`)

- 2-column grid의 outline 버튼 2개
- 사진 갤러리 (`data-testid="photo-gallery-entry"`) — `ImageIcon` + "사진 갤러리" → `/photos`
- 가계부 (`data-testid="cashbook-entry"`) — `BookOpen` + "가계부" → `/cashbook/history`
- 썸네일 미사용

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

- shadcn `Tabs`, 값: `all | income | expense | investment | flex`
- 라벨: 전체 / 지출 / 수입 / FLEX / 투자
- `data-testid="group-tabs"`
- `all`이면 모든 entries, 그 외엔 `entry.type === group`로 필터

### 카테고리 비교 선택기 (`CategorySelector`)

- 칩 멀티 토글 (`data-testid="category-selector"`, 칩별 `data-testid="category-chip-{name}"`)
- 옵션은 현재 그룹 탭 + 기간에서 데이터가 있는 카테고리(amount 내림차순)
- 최대 동시 선택: **5개** (`MAX_TREND_CATEGORIES`)
- 기본 선택: 기간 내 금액 상위 **3개** (`DEFAULT_TREND_TOP_N`)
- 그룹/기간/cursor 변경 시 사용자 선택은 자동 리셋되어 다시 자동 상위 3개로 돌아감

### 시계열 추이 차트 (`BudgetTrendChart`)

- `recharts LineChart` + shadcn `ChartContainer` + Legend
- `data-testid="trend-chart"`
- 선택된 카테고리당 라인 1개 (스트로크 색 = 카테고리 메타 `color`)
- 버킷 규칙:
  - weekly: 일별 7개 (일~토)
  - monthly: 일별 (해당 월의 일수, 28~31)
  - yearly: 월별 12개
- X축 라벨: 요일 / 일자 / 월
- 선택 0개일 때는 안전망으로 EmptyState 표시 ("비교할 카테고리를 선택해주세요")

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
- 선택 그룹의 기간 총합:
  - `all`: 수입(`type==='income'`) 합 − 지출(`type==='expense'`) 합. flex/investment는 제외.
  - 그 외: 해당 그룹의 `amount` 합계
- 색상: 지출=expense, 수입=income, 그 외=foreground

### 로딩 상태

- 차트 영역 각각 `Skeleton`

### 빈 데이터 상태

- 그룹 필터 적용 후 entries가 비면 차트 영역 전체를 `dashboard-empty` 통합 `EmptyState`로 대체한다 ("이 기간엔 내역이 없어요").

---

## 관련 문서

- 가계부 도메인: `03-domain-models.md` → CashbookEntry, CashbookCategory
- 카테고리 분류: `pages/04a-cashbook-categories.md`
- 사진 갤러리: `pages/03-photo-gallery.md`
- 가계부 상세: `pages/04-cashbook.md`
