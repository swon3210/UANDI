# 페이지 명세: 카테고리 AI 종합 분석 (/inner/cashbook/analysis)

## 목적

대시보드 기간 비교 카드에서 **비교하던 카테고리 묶음 전체**(고른 게 없으면 그 범위 전체)를 한 번에 들여다보는 드릴다운 페이지.
카테고리마다 따로 보고서를 만들지 않고, 묶음 전체를 **하나의 종합 리포트**로 분석한다.
이번 달 합계를 대시보드에서 고른 비교 대상(전월·고른 달·평소)과 견주고, 변화가 큰 카테고리·최근 추이를 함께 보여준다. 이번 달 내역 목록은 길어서 두지 않고, 눈에 띄는 내역은 AI 리포트가 짚는다.

---

## 사용자 스토리

- 커플로서, 기간 비교에서 고른 카테고리들이 이번 달 왜 그렇게 움직였는지 한 번에 알고 싶다.
- 커플로서, 그 묶음 안에서 어떤 카테고리가 증감을 이끌었는지 보고 싶다.
- 커플로서, 그 묶음의 최근 몇 달 흐름을 한눈에 보고 싶다.
- 커플로서, AI가 짚어주는 눈에 띄는 내역과 제안을 읽고 싶다.

---

## 진입

- 대시보드 기간 비교 아래 AI 요약 카드의 `전체 리포트 보기`(`compare-ai-analysis`, 월간 탭 전용) — `docs/pages/02-dashboard.md` 「AI 요약 카드」. 대시보드 요약과 같은 리포트(같은 쿼리 키)라 대시보드에서 이미 만들었으면 바로 보인다
- URL: `/inner/cashbook/analysis?group={expense|income}[&sub=fixed|variable][&at=YYYY-MM-DD][&cat={이름}…][&cmp=median|YYYY-MM-DD]`
  - `group` 필수. 없거나 잘못되면 안내(`category-analysis-empty`, "분석할 카테고리를 찾을 수 없어요") + 뒤로 가기
  - `sub` = 대시보드 고정/변동 세부 필터 (생략 시 전체)
  - `at` = 기준 달 시작일 (생략 시 이번 달, 미래면 이번 달)
  - `cat` = 고른 카테고리 (반복 키). **생략하면 그룹·세부 필터 범위 전체**를 분석
  - `cmp` = 비교 대상. `median` = 평소, 날짜 = 그 달, 생략 = 전월
- 월간 탭 전용 기능이라 기준은 항상 **달** 단위
- **페이지 안에서 카테고리 다시 고르기**: 요약 카드의 `카테고리 선택 ›`(`category-analysis-category-button`) → 대시보드와 같은 `CompareCategorySheet`(제목 `분석할 카테고리 선택`, 검색·상위/하위 묶음, 지금 고른 것 체크)
  - 후보(`scopeCategories`): 고른 것과 상관없이 그룹·세부 필터 범위에서 이번 달이나 비교 대상에 금액이 있는 카테고리 + 지금 고른 카테고리
  - 적용하면 `cat`만 바꾼 URL로 `router.replace`(기록 추가 없음, 뒤로 가기는 여전히 대시보드) → 그 묶음으로 다시 분석(새 리포트 1회). 모두 해제하면 범위 전체
  - 대시보드의 선택은 바뀌지 않는다

---

## UI 구성

```
┌─────────────────────────┐
│ ←   카테고리 AI 분석      │  ← Header (BackButton)
├─────────────────────────┤
│  선택한 카테고리 3개  지출 │  ← 범위 이름 (category-analysis-title)
│  2026년 10월 기준        │     카테고리 1개면 그 이름, 고른 게 없으면 "전체 변동 지출" 등
│  (●여행)(●식비)(●데이트) [카테고리 선택 ›]│ ← 칩 (category-analysis-chip-{이름}), 범위 전체면 없음
│                         │     + category-analysis-category-button
│  ┌─────────┐┌─────────┐ │
│  │이번 달   ││평소·5개월 중위값│ ← category-analysis-current / -compare(-label)
│  │4,693,000││1,650,000 │ │
│  └─────────┘└─────────┘ │
│  🚨 평소 대비 ▲ 3,043,000원 (184%)│ ← category-analysis-delta
│                         │
│  (전체)(●여행)(●식비)(●데이트)│ ← TrendCategoryFilter (category-analysis-trend-filter-{전체|이름})
│  전체 최근 6개월 추이 · 점선 = 평소│ ← category-analysis-trend-caption
│  [월 합계 막대 + 점선]      │  ← CategoryTrendChart (category-analysis-chart)
│                         │
│  7개 중 큰 변화 5개  평소 → 이번 달│ ← CategoryAnalysisBreakdown (2개 이상일 때, 최대 5개)
│  ● 여행   3,533,000원     │     category-analysis-row-{이름}
│           200,000원 · ▲ 3,333,000원│
│  ● 식비   …               │
│                         │
│  ✨ AI 분석              │
│  ┌───────────────────┐  │
│  │ ## 📊 요약          │  │  ← AiReportCard (category-analysis-report) — 1개만
│  │ ## 📈 비교          │  │
│  │ ## 🧩 카테고리별로 보면│ │
│  │ ## 🔍 눈에 띄는 내역│  │
│  │ ## 💡 제안         │  │
│  └───────────────────┘  │
│  [↻ 다시 분석]           │  ← category-analysis-retry
└─────────────────────────┘
```

---

## 기술 명세

### 데이터 (`useCategoryAnalysisData`)

- 기준 달 + 직전 6개월(`MEDIAN_WINDOW_MONTHS`)을 대시보드와 같은 월 범위 쿼리 키로 조회 (`useMonthWindowEntries`) → 대시보드에서 넘어오면 캐시를 그대로 쓴다
- 비교 달(`cmp`가 날짜이거나 전월)은 `cashbookEntriesInRangeOptions`로 조회 — 최근 6개월 안이면 같은 쿼리 키라 추가 요청 없음
- 그룹·세부 필터를 대시보드와 같은 기준(`filterEntries`)으로 적용한 뒤 `cat`이 있으면 그 카테고리만 남긴다
- 비교 대상 합계(`compareAmount`)
  - 달: 그 달의 묶음 합계
  - 평소: 직전 6개월 중 그 그룹(+세부 필터)에 기록이 있는 달들을 표본으로, **달마다 묶음 합계를 낸 뒤의 중위값** (`selectionMedian`) — 대시보드 평소 비교 요약과 같은 값
  - 평소 표본이 2개월 미만이면 `—` + 안내 ("지난달 기록이 2개월 이상 쌓이면 평소와 비교해 드려요"), 증감 줄 없음
- 카테고리별 행(`rows`): 고른 카테고리 전부(금액 0이어도), 범위 전체면 이번 달 또는 비교 대상에 금액이 있는 카테고리. 비교 금액은 그 달 금액 또는 카테고리별 중위값. 이번 달 → 비교 금액 내림차순
- 큰 변화 목록(`CategoryAnalysisBreakdown`): `rows`를 비교 대상 대비 변화(절댓값, 비교 금액이 없으면 이번 달 금액)가 큰 순으로 **최대 5개** (`pickTopChanges`, 대시보드 AI 요약과 같은 기준). 5개를 넘으면 헤더에 `N개 중 큰 변화 5개`
- 추이 차트: 기본은 묶음의 월 합계 + 묶음 평소 점선(중위값, 표본 부족이면 없음) — 비교 대상이 특정 달이어도 점선은 평소
  - 카테고리가 2개 이상이면 차트 위 필터 칩(`TrendCategoryFilter`): `전체` + 범위의 카테고리 전부(이번 달 금액 순, 넘치면 가로 스크롤). 하나를 고르면 그 카테고리의 월 금액과 그 카테고리 평소 점선(`trends`)
  - 캡션(`category-analysis-trend-caption`): `{전체|카테고리} 최근 6개월 추이 · 점선 = 평소 N원`
- 이번 달 내역 목록은 보여주지 않는다 (AI 요청에는 금액 큰 순 100건까지 보낸다). 범위에 카테고리가 하나도 없으면(어느 달에도 기록 없음) AI 분석은 하지 않는다

### AI 분석 (`POST /api/ai/analyze-category`)

- 요청

  ```ts
  {
    group: 'expense' | 'income';
    scope: string; // 범위 이름 (예: "여행·식비·데이트", "전체 변동 지출"), 1~200자
    year: number;
    month: number; // 기준 달 (1~12)
    compare: {
      label: string;
      amount: number | null;
    } // "평소(최근 6개월 중위값)" | "2026년 9월"
    current: {
      amount: number;
      count: number;
      entries: {
        date: string;
        category: string;
        amount: number;
        description: string;
      }
      []; // 최대 100건
    }
    categories: {
      category: string;
      current: number;
      compare: number | null;
      count: number;
    }
    []; // 1~30개
    history: {
      year: number;
      month: number;
      amount: number;
      count: number;
    }
    []; // 묶음 월 합계, 오래된 순, 최대 12
    median: number | null; // 묶음 평소, 표본 부족이면 null
  }
  ```

- 응답: `text/event-stream`, `data: {"text": "..."}` 청크 + `data: [DONE]` (지출 분석과 동일)
- 인증·일일 한도·AI 설정(말투/관점) 처리는 `analyze-spending`과 같다. `USE_AI_MOCK=true`면 범위 이름·카테고리 이름을 넣은 고정 텍스트
- 섹션 고정: `## 📊 요약` / `## 📈 비교` / `## 🧩 카테고리별로 보면` / `## 🔍 눈에 띄는 내역` / `## 💡 제안`
  - `요약`은 첫 줄에 **전체 결론 한 문장**(40자 이내, 합계 금액 없이), 이어서 **변화가 큰 카테고리 5개**(서버가 `pickTopChanges`로 골라 프롬프트에 순서대로 넘김)마다 `- 카테고리: 이유`(20자 이내 한 구절) 한 줄씩만. 대시보드 AI 요약 카드가 이 줄들을 증감 막대 아래에 붙인다
  - 이번 달 합계·건수, 비교 대상 합계, 증감액은 화면 그래프에 이미 보이므로 **어느 섹션에서도 다시 나열하지 않는다** ("이번 달 OO에 N원이 N건" 금지). 금액은 원인 설명에 필요한 개별 카테고리·내역 금액만
  - 카테고리마다 따로 쓰지 말고 묶음 전체의 흐름 안에서 각 카테고리의 역할을 엮어 설명하도록 지시
  - 각 1~3문장, 격려하는 톤, 수입이면 "썼어요" 대신 "들어왔어요" 맥락
- 카테고리 이름·내역 설명은 서버에서 제어문자·따옴표 제거 후 길이 제한(이름 60자, 설명 40자)을 두고 프롬프트에 넣는다

### 클라이언트

- `useCategoryAnalysisReport`: `useQuery` + `experimental_streamedQuery`(청크를 문자열로 누적)로 **페이지 진입 시 자동 실행**.
  쿼리 키 `['categoryAnalysis', coupleId, group, sub, 정렬된 카테고리, YYYY-MM, 비교 대상]`, `staleTime: Infinity` → 뒤로 갔다 다시 와도 재호출하지 않는다 (일일 한도 보호)
- "다시 분석"(`category-analysis-retry`)은 `refetch()` (기본 `reset` 모드라 처음부터 다시 스트리밍)
- 상태: 첫 청크 전 로딩(`category-analysis-loading`) → 스트리밍/완료 본문(`category-analysis-report`, `react-markdown`) → 실패 시 메시지(`category-analysis-error`) + 다시 분석

### 컴포넌트

| 컴포넌트                    | 역할                                                                         |
| --------------------------- | ---------------------------------------------------------------------------- |
| `CategoryAnalysisSummary`   | 범위 이름·칩·기준 달·이번 달/비교 대상 두 칸·증감 한 줄                      |
| `TrendCategoryFilter`       | 추이 차트 위 `전체`/카테고리 필터 칩 (2개 이상일 때만)                       |
| `CategoryTrendChart`        | 월 금액 막대 + 평소 점선 (`recharts BarChart`)                               |
| `CategoryAnalysisBreakdown` | 변화가 큰 카테고리 최대 5개: 이번 달 금액 + 비교 금액·증감 (2개 이상일 때만) |
| `AiReportCard`              | 로딩/스트리밍/완료/실패 상태의 마크다운 종합 보고서 + 재시도                 |

---

## 관련 문서

- 대시보드 기간 비교(평소 비교·AI 분석 버튼): `docs/pages/02-dashboard.md` → 「기간 비교 차트」
- AI 공통 규칙: `docs/pages/05-ai-features.md`
