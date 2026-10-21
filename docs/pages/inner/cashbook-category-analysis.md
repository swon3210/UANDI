# 페이지 명세: 카테고리 AI 분석 (/inner/cashbook/analysis)

## 목적

대시보드 "평소와 비교" 카드에서 눈에 띄는 카테고리를 눌렀을 때, **그 카테고리 하나**를 깊이 들여다보는 드릴다운 페이지.
최근 달들의 추이와 이번 달 내역을 보여주고, AI가 평소 대비 변화의 원인과 제안을 한국어 마크다운으로 설명한다.

---

## 사용자 스토리

- 커플로서, 이번 달 유난히 많이(적게) 쓴 카테고리가 왜 그런지 바로 알고 싶다.
- 커플로서, 그 카테고리의 최근 몇 달 흐름을 한눈에 보고 싶다.
- 커플로서, AI가 짚어주는 눈에 띄는 내역과 제안을 읽고 싶다.

---

## 진입

- 대시보드 `MedianCompareCard`의 카테고리 행(`median-highlight-{카테고리}`)이 링크다 (행 끝에 `›`)
- URL: `/inner/cashbook/analysis?category={이름}&group={expense|income}[&at=YYYY-MM-DD][&sub=fixed|variable]`
  - `at` = 기준 달 시작일 (생략 시 이번 달), `sub` = 대시보드의 고정/변동 세부 필터 (생략 시 전체)
  - `category`/`group`이 없거나 잘못되면 안내(`category-analysis-empty`, "분석할 카테고리를 찾을 수 없어요") + 뒤로 가기
- 월간 탭 전용 기능이라 기준은 항상 **달** 단위

---

## UI 구성

```
┌─────────────────────────┐
│ ‹   카테고리 AI 분석      │  ← Header (뒤로 가기 = router.back)
├─────────────────────────┤
│  여행              지출  │  ← 카테고리 이름 + 그룹 (category-analysis-title)
│  2026년 10월 기준        │  ← 기준 달 (category-analysis-month)
│  ┌─────────┐┌─────────┐ │
│  │이번 달   ││평소(중위값)│ │  ← category-analysis-current / -median
│  │3,533,000││ 92,000원 │ │
│  └─────────┘└─────────┘ │
│  [최근 6개월 + 이번 달 막대]│  ← CategoryTrendChart (category-analysis-chart)
│                         │     이번 달 막대만 그룹 색, 평소 점선(ReferenceLine)
│  ✨ AI 분석              │
│  ┌───────────────────┐  │
│  │ ## 📊 이번 달 요약  │  │  ← AiReportCard (category-analysis-report)
│  │ ## 📈 평소와 비교   │  │     스트리밍으로 점진 표시, 마크다운 렌더
│  │ ## 🔍 눈에 띄는 내역│  │
│  │ ## 💡 제안         │  │
│  └───────────────────┘  │
│  [↻ 다시 분석]           │  ← category-analysis-retry
│                         │
│  이번 달 내역 N건         │  ← category-analysis-entries (날짜·설명·금액, 최신순)
│  10/12  제주 항공권  …원  │
└─────────────────────────┘
```

---

## 기술 명세

### 데이터

- 기준 달 + 직전 6개월(`MEDIAN_WINDOW_MONTHS`)을 대시보드와 같은 월 범위 쿼리 키(`useCashbookEntriesInRange`)로 조회 (`useMonthWindowEntries`) → 대시보드에서 넘어오면 캐시를 그대로 쓴다
- 그룹·세부 필터를 대시보드와 같은 기준(`filterEntries`)으로 적용한 뒤 `category` 이름이 같은 내역만 남긴다
- 평소(중위값)는 카드와 같은 규칙: 직전 6개월 중 그 그룹에 기록이 있는 달들만 표본으로, 그 달에 이 카테고리가 없으면 0원 (`categoryMedian`)
- 표본이 2개월 미만이면 평소 칸은 `—`, 차트에 평소 선 없음. AI 분석은 그래도 진행한다 (이번 달 내역이 있을 때)
- 이번 달 내역이 0건이면(`missing`) 내역 목록 대신 "이번 달엔 기록이 없어요"를 보여주고 AI 분석은 평소 금액만으로 진행

### AI 분석 (`POST /api/ai/analyze-category`)

- 요청

  ```ts
  {
    category: string; // 1~60자
    group: 'expense' | 'income';
    year: number;
    month: number; // 기준 달 (month 1~12)
    current: {
      amount: number;
      count: number;
      entries: {
        date: string;
        amount: number;
        description: string;
      }
      []; // 최대 100건
    }
    history: {
      year: number;
      month: number;
      amount: number;
      count: number;
    }
    []; // 직전 달들, 오래된 순, 최대 12
    median: number | null; // 표본 부족이면 null
  }
  ```

- 응답: `text/event-stream`, `data: {"text": "..."}` 청크 + `data: [DONE]` (지출 분석과 동일)
- 인증·일일 한도·AI 설정(말투/관점) 처리는 `analyze-spending`과 같다. `USE_AI_MOCK=true`면 카테고리 이름을 넣은 고정 텍스트
- 섹션 고정: `## 📊 이번 달 요약` / `## 📈 평소와 비교` / `## 🔍 눈에 띄는 내역` / `## 💡 제안`. 각 1~3문장, 격려하는 톤, 수입이면 "썼어요" 대신 "들어왔어요" 맥락
- 내역 설명은 서버에서 제어문자·따옴표 제거 + 40자로 잘라 프롬프트에 넣는다

### 클라이언트

- `useCategoryAnalysis`: `useQuery` + `experimental_streamedQuery`(청크를 문자열로 누적)로 **페이지 진입 시 자동 실행**.
  쿼리 키 `['categoryAnalysis', coupleId, group, sub, category, year, month]`, `staleTime: Infinity` → 뒤로 갔다 다시 와도 재호출하지 않는다 (일일 한도 보호)
- "다시 분석"(`category-analysis-retry`)은 `refetch()` (기본 `reset` 모드라 처음부터 다시 스트리밍)
- 상태: 첫 청크 전 로딩(`category-analysis-loading`) → 스트리밍/완료 본문(`category-analysis-report`, `react-markdown`) → 실패 시 메시지(`category-analysis-error`) + 다시 분석

### 컴포넌트

| 컴포넌트                  | 역할                                                    |
| ------------------------- | ------------------------------------------------------- |
| `CategoryAnalysisSummary` | 이름·그룹·기준 달·이번 달/평소 두 칸                    |
| `CategoryTrendChart`      | 월별 막대 + 평소 점선 (`recharts BarChart`)             |
| `AiReportCard`            | 로딩/스트리밍/완료/실패 상태의 마크다운 보고서 + 재시도 |

---

## 관련 문서

- 대시보드 중위값 비교 카드: `docs/pages/02-dashboard.md` → 「월 중위값 비교 카드」
- AI 공통 규칙: `docs/pages/05-ai-features.md`
