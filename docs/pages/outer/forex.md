# 페이지 명세: 재테크 — 환테크 (/outer/forex)

## 목적

원화(KRW)와 외화(USD/JPY/EUR/CNY)를 매매하여 환차익을 노리는 사용자에게
**(1) 통화별 환율 추이 차트**와 **(2) 매수/매도/관망 추천 정보**를 제공한다.

이번 1차 PR은 **의사결정 보조용 정보 화면**까지만 다룬다.
거래 기록·보유 외화·실현 손익은 후속 PR에서 추가한다.

> **재테크 영역 문서 구성**
>
> | 파일                           | 내용                         | 상태       |
> | ------------------------------ | ---------------------------- | ---------- |
> | `outer/dashboard.md`           | 재테크 대시보드              | v1         |
> | `outer/forex.md` (이 문서)     | 환테크 차트 + AI 전망        | v1         |
> | `outer/investment.md`          | 투자 placeholder → 본 구현   | v1.1 예정  |
> | `outer/savings.md`             | 적금 placeholder → 본 구현   | v1.1 예정  |
> | (예정) `outer/forex-trade.md`  | 외화 거래 기록 + 보유 + 손익 | v1.1 예정  |
> | (예정) `outer/forex-alerts.md` | 목표 환율 알림               | v1.1+ 예정 |

---

## 사용자 스토리

- 커플로서, 최근 달러 환율이 오르는 중인지 떨어지는 중인지 한눈에 보고 싶다.
- 커플로서, "지금 1,000달러 사도 될까?"를 결정할 때 참고할 객관적 지표가 필요하다.
- 커플로서, 단순 차트만 보는 게 아니라 **"매수 우호 / 매도 우호 / 중립"** 같은 명확한 신호를 받고 싶다.
- 커플로서, AI가 최근 흐름을 한국어 1~2문장으로 요약해주면 좋겠다.

---

## 정보 구조 (Route Tree)

```
/outer                       → 재테크 대시보드 (outer/dashboard.md)
/outer/forex                 → 통화 목록 (USD/JPY/EUR/CNY 4개 카드)
/outer/forex/[currency]      → 통화 상세 (차트 + 지표 + AI 전망)
```

- `currency`는 화이트리스트: `USD | JPY | EUR | CNY`. 그 외는 404.
- 진입점:
  1. 사이드바 재테크 섹션의 "환테크" 항목 → `/outer/forex`
  2. 재테크 대시보드(`/outer`)의 환테크 요약 카드 → `/outer/forex`
- 사이드바 재테크 섹션 구성: 홈(`/outer`) · 환테크(`/outer/forex`) · 투자(`/outer/investment`) · 적금(`/outer/savings`).

---

## UI 구성

### 1. 홈 대시보드 진입 카드 (`Dashboard.tsx`)

```
┌─────────────────────────┐
│  💱 환테크              │
│  USD 1,380.5  ▲ 0.3%   │  ← 대표 통화(USD) 현재가 + 등락
│  최근 1주 ▁▂▄▆▇        │  ← 스파크라인(선택, 무리면 생략)
└─────────────────────────┘
```

- 카드 전체가 `Link` → `/outer/forex`
- 데이터 없을 때(로딩) Skeleton

### 2. 통화 목록 (`/outer/forex`)

```
┌─────────────────────────┐
│  ☰  환테크              │  ← Header (사이드바 토글)
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ 🇺🇸 USD  매수 우호  │  │  ← BuyRecommendationBadge
│  │ 1,380.5원          │  │
│  │ ▲ 0.3% (어제 대비) │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇯🇵 JPY/100  중립   │  │
│  │ 908.2원            │  │
│  │ ▼ 0.1%             │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇪🇺 EUR  매도 우호  │  │
│  │ ...                │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇨🇳 CNY            │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

- 카드 클릭 → `/outer/forex/USD`
- 추천 뱃지는 **기술 지표 기반**만 표시 (AI 분석은 상세 화면에만)
- JPY는 관례에 따라 **100엔당 원화**로 표시

### 3. 통화 상세 (`/outer/forex/[currency]`)

```
┌─────────────────────────┐
│  🇺🇸 USD/KRW         ←  │
├─────────────────────────┤
│  1,380.5원              │  ← 현재가 (큰 폰트)
│  ▲ 4.2원 (+0.3%)        │
│                         │
│  [1W][1M][3M][6M][1Y][5Y]  ← TimeRangeSelector
│                         │
│  ┌───────────────────┐  │
│  │       📈           │  │
│  │   ExchangeRateChart│  │  ← recharts LineChart + MA5/MA20
│  │                    │  │
│  └───────────────────┘  │
│                         │
│  지표                   │  ← IndicatorPanel
│  ┌───────────────────┐  │
│  │ MA20    1,375.2원  │  │
│  │ MA60    1,360.8원  │  │
│  │ RSI(14) 42         │  │
│  │ 52주 백분위 35%    │  │
│  └───────────────────┘  │
│                         │
│  AI 전망                │  ← ForecastCard
│  ┌───────────────────┐  │
│  │ [매수 우호]         │  │
│  │ 최근 한 달간 완만한 │  │
│  │ 하락세이며 52주    │  │
│  │ 최저가 근처에 있어 │  │
│  │ 매수 진입에 유리한 │  │
│  │ 구간입니다.        │  │
│  │ [다시 분석]         │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

- 차트 색상: **한국 관례**(상승 빨강 `--destructive`, 하락 파랑 `#3b82f6`)
- MA5/MA20 오버레이는 회색 점선
- 기간 변경 시 차트만 리로딩 (지표·AI 전망은 90일 고정)

---

## 기술 명세

### 데이터 소스: Frankfurter API

**엔드포인트**

- 최신: `GET https://api.frankfurter.app/latest?from=USD&to=KRW`
- Historical 범위: `GET https://api.frankfurter.app/{start}..{end}?from=USD&to=KRW`
  - 날짜는 `YYYY-MM-DD`
  - 응답: `{ amount, base, start_date, end_date, rates: { "2024-...": { KRW: 1380.5 }, ... } }`
- 키 불필요, CORS 허용, 무료
- **갱신 주기**: ECB가 영업일 1일 1회 발표 (16:00 CET). 분/실시간 호출 무의미.

**통화 정규화**

- KRW를 기준 화폐로 보여주기 위해 `from=외화, to=KRW`로 호출 → 1단위당 KRW 환산값.
- JPY만 UI 표시 시 `* 100` 적용 (100엔당 원화).

### 서버 프록시 — `/api/forex/rates`

```ts
// GET /api/forex/rates?currency=USD&range=1y
// 응답
{
  currency: 'USD',
  points: { date: string, rate: number }[],  // 시계열 (오래된 순)
  latest: number,                            // points 마지막 값
  prevClose: number | null                   // 어제(직전 영업일) 값
}
```

- **캐시**: `revalidate: 3600` + `Cache-Control: public, s-maxage=3600` (1시간)
- **검증**: currency는 4개 화이트리스트, range는 `1w|1m|3m|6m|1y|5y`만 허용 → 400
- **실패 시 fallback**: Frankfurter 응답 실패 → 503 + `{ error: '환율 데이터를 가져올 수 없습니다' }`
- **인증 불요**: 환율 데이터는 공개 정보. 단, AI 라우트는 인증 필수.

### 클라이언트 훅 — `useForex.ts`

```ts
useForexRates(currency: SupportedCurrency, range: ForexRange)
  // QueryKey: ['forex', 'rates', currency, range]
  // staleTime: 30 * 60 * 1000  (30분)

useForexIndicators(points: ExchangeRatePoint[])
  // useMemo로 ma5/ma20/ma60/rsi14/percentile52w 계산 (외부 호출 없음)

useForexOutlook(currency: SupportedCurrency)
  // POST /api/ai/forex-outlook
  // QueryKey: ['forex', 'outlook', currency]
  // staleTime: 6 * 60 * 60 * 1000  (6시간)
  // enabled: 기본 false → 사용자가 [다시 분석] 또는 첫 마운트 시 명시 호출
```

### 지표 계산식

`@uandi/investment-core` 패키지의 순수 함수로 분리.

| 지표        | 정의                                                 |
| ----------- | ---------------------------------------------------- |
| MA(n)       | 최근 n일 종가 단순 평균                              |
| RSI(14)     | 14일 평균 상승폭 / (평균 상승폭 + 평균 하락폭) × 100 |
| 52주 백분위 | 최근 252영업일 중 현재값의 백분위 (0~100)            |

### 추천 로직 (기술 지표만, AI 미사용)

`computeRecommendation(indicators) → 'buy' | 'sell' | 'hold'`

| 조건                                  | 결과 |
| ------------------------------------- | ---- |
| 52주 백분위 ≤ 25 **AND** RSI(14) ≤ 35 | buy  |
| 52주 백분위 ≥ 75 **AND** RSI(14) ≥ 65 | sell |
| 그 외                                 | hold |

- 통화 목록 카드의 뱃지는 이 규칙만 사용 (외부 API 호출 없음, 즉시 표시)
- 상세 화면의 AI 전망은 별도 (아래)

---

## AI 전망 분석

### API Route — `POST /api/ai/forex-outlook`

**공통 규칙** (`docs/pages/05-ai-features.md`와 동일)

- POST만 허용, JSON 응답
- Firebase Auth 토큰 인증 (`verifyAuth`)
- 일일 사용량 제한: 커플당 50회/일 (`checkAndIncrementUsage`, 카운터 키: `aiUsage`)
- 모델: **`gpt-5-mini`** (정확한 모델 ID는 구현 시점 OpenAI 문서 재확인)

**Request**

```ts
{
  currency: 'USD' | 'JPY' | 'EUR' | 'CNY';
  points: {
    date: string;
    rate: number;
  }
  []; // 최근 90일
  indicators: {
    current: number;
    ma20: number;
    ma60: number;
    rsi14: number;
    percentile52w: number; // 0~100
  }
}
```

**Response**

```ts
{
  summary: string; // 1~3문장 한국어 요약
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number; // 0~1
}
```

- `response_format: { type: 'json_object' }` (JSON 모드 강제)
- `max_tokens` 적당히 (300 정도)

### 프롬프트 전략

- 시스템: "당신은 외환 시장 분석 어시스턴트입니다. 한국 개인 투자자가 환테크 의사결정에 참고할 수 있도록 최근 90일 시계열과 기술 지표를 바탕으로 매수/매도/관망 추천과 근거를 1~3문장 한국어로 제시하세요. 단정적 예측은 피하고 '가능성', '경향' 같은 표현을 사용하세요."
- 사용자: 시계열 압축(첫/중간/마지막 + 최대/최소) + indicators JSON
- 절대 단정적 예측("100% 오릅니다") 금지 — 시스템 프롬프트에 명시

---

## 도메인 타입 (`packages/investment-core/src/types.ts`)

```ts
export type SupportedCurrency = 'USD' | 'JPY' | 'EUR' | 'CNY';

export type ForexRange = '1w' | '1m' | '3m' | '6m' | '1y' | '5y';

export type ExchangeRatePoint = {
  date: string; // 'YYYY-MM-DD'
  rate: number; // 1 단위당 KRW
};

export type ForexIndicators = {
  current: number;
  ma5: number;
  ma20: number;
  ma60: number;
  rsi14: number;
  percentile52w: number;
};

export type ForexRecommendation = 'buy' | 'sell' | 'hold';

export type ForexOutlook = {
  summary: string;
  confidence: number;
};
// 추천(매수/매도/관망)은 클라이언트의 computeRecommendation(indicators)을 단일 출처로 사용.
// AI는 해당 추천을 뒷받침하는 summary와 confidence만 생성한다.

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['USD', 'JPY', 'EUR', 'CNY'];

export const CURRENCY_META: Record<
  SupportedCurrency,
  {
    flag: string;
    label: string;
    displayDivisor: number; // JPY=100, 나머지=1
  }
> = {
  USD: { flag: '🇺🇸', label: '미국 달러', displayDivisor: 1 },
  JPY: { flag: '🇯🇵', label: '일본 엔(100엔)', displayDivisor: 0.01 },
  EUR: { flag: '🇪🇺', label: '유로', displayDivisor: 1 },
  CNY: { flag: '🇨🇳', label: '중국 위안', displayDivisor: 1 },
};
```

> Firestore 컬렉션은 이번 PR에서 추가하지 않는다. 거래 기록/보유 외화는 Phase 2에서 도입.

---

## 색상 정책

- 상승: `--destructive` (한국 관례: 빨강)
- 하락: `text-blue-500` 또는 새 토큰 `--down` 추가 검토
- 추천 뱃지: 매수=`--income`(녹), 매도=`--destructive`(빨), 관망=`muted`

---

## 환경 변수

추가 변경 없음.

- `OPENAI_API_KEY` 이미 존재 (`apps/web/.env.local`)
- Frankfurter는 키 불필요

---

## 비기능 / 사용량

- **외부 API 호출 빈도**: `/api/forex/rates`는 1시간 캐시 → 시간당 4개 통화 × range 6종 = 최대 24회/시간
- **AI 사용량 제한**: 기존 가계부 AI와 합산하여 커플당 50회/일 (카운터 공유)
- **오프라인**: 캐시된 차트 데이터만 표시, AI 카드는 비활성화
- **성능**: 차트 데이터는 90일 ≤ 500 points이므로 클라이언트 가공 부담 없음

---

## 테스트 전략

- E2E: Frankfurter / OpenAI 응답을 Playwright `route.fulfill()` 로 모킹 (네트워크 의존 제거)
- 지표 계산 유틸은 패키지 단위 테스트 (vitest, 기존 cashbook-core 패턴)
- 모킹 케이스:
  - 정상 응답 → 차트 + 지표 + AI 카드 모두 렌더
  - Frankfurter 503 → 에러 메시지
  - OpenAI 429 (한도 초과) → AI 카드만 에러, 차트/지표는 정상

---

## Phase 2 이후 로드맵

- **Phase 2** (`06a-investment-forex-trade.md`)
  - 외화 매수/매도 거래 기록 (`couples/{coupleId}/forexTrades`)
  - 보유 외화 잔액 + 평균 단가 (`couples/{coupleId}/forexHoldings/{currency}`)
  - 손익 계산 (평균 단가법) — 미실현/실현 손익 패널
- **Phase 3** (`06b-investment-alerts.md`)
  - 목표 환율 알림 ("USD 1,300원 이하 진입 시 알림")
  - 한국은행 ECOS API 도입 — 매매기준율/현찰 살때/팔때 스프레드 반영
- **Phase 4** (선택)
  - 다중 통화 비교 차트
  - 적금·예금 영역 (`/outer/savings`) — `/outer` 진입 페이지를 자산 대시보드로 확장

---

## 관련 문서

- AI 라우트 공통 패턴: `05-ai-features.md`
- 디자인 시스템(색상, Card, Badge): `02-design-system.md`
- 테스트 전략: `05-testing-strategy.md`
