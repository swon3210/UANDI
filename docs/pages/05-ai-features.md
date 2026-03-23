# AI 기능 명세

## 개요

UANDI에 3가지 AI 기능을 추가한다. 모두 **Claude API**(Anthropic)를 사용하며,
Next.js API Route를 통해 서버 사이드에서 호출한다 (API 키 보호).

---

## 공통 아키텍처

```
[클라이언트] → [Next.js API Route] → [Claude API]
                    │
                    └── API 키는 서버 환경변수 (ANTHROPIC_API_KEY)
```

### API Route 구조

```
apps/web/src/app/api/ai/
├── parse-entry/route.ts      # 자연어 가계부 파싱
├── suggest-tags/route.ts     # 사진 자동 태깅
└── analyze-spending/route.ts # 지출 패턴 분석
```

### 공통 규칙

- 모든 API Route는 `POST` 메서드만 허용
- Firebase Auth 토큰으로 인증 검증 (미인증 시 401)
- 응답은 JSON 형식
- 에러 시 `{ error: string }` 반환
- 일일 사용량 제한: 사용자당 50회/일 (Firestore 카운터)

---

## 기능 1: 자연어 가계부 입력

### 목적

"점심 김치찌개 9000원" 같은 자연어 입력을 구조화된 가계부 데이터로 변환한다.

### UI 위치

가계부 메인 페이지(`/cashbook`) 상단에 텍스트 입력 필드 추가.
기존 `+` 버튼(수동 입력)과 병행 사용.

### 입력 → 출력 예시

| 입력 | 출력 |
|------|------|
| "점심 김치찌개 9000원" | `{ type: "expense", amount: 9000, category: "식비", description: "김치찌개", date: "오늘" }` |
| "월급 350만원" | `{ type: "income", amount: 3500000, category: "정기급여", description: "월급", date: "오늘" }` |
| "3월 15일 데이트 카페 12000원" | `{ type: "expense", amount: 12000, category: "데이트", description: "카페", date: "2026-03-15" }` |
| "택시 15000" | `{ type: "expense", amount: 15000, category: "교통", description: "택시", date: "오늘" }` |

### API Route

**`POST /api/ai/parse-entry`**

Request:
```ts
{
  text: string;           // 사용자 자연어 입력
  categories: string[];   // 현재 커플의 카테고리 이름 목록 (매칭용)
}
```

Response:
```ts
{
  type: CashbookEntryType;  // 'income' | 'expense' | 'investment' | 'flex'
  amount: number;
  category: string;         // categories 목록에서 가장 적합한 것 선택
  description: string;
  date: string;             // ISO 8601 (YYYY-MM-DD)
  confidence: number;       // 0~1 (파싱 신뢰도)
}
```

### UX 플로우

1. 사용자가 텍스트 입력 → Enter 또는 전송 버튼
2. API 호출 중 로딩 표시
3. 파싱 결과를 EntryForm에 미리 채움 (pre-fill)
4. 사용자가 확인/수정 후 저장
5. `confidence < 0.7`이면 "정확하지 않을 수 있어요" 경고 표시

### 프롬프트 전략

- 시스템 프롬프트에 카테고리 목록 포함
- JSON 출력 강제 (`response_format` 또는 프롬프트 지시)
- 오늘 날짜를 컨텍스트로 전달
- Few-shot 예시 포함

---

## 기능 2: 사진 자동 태깅

### 목적

사진 업로드 시 이미지를 분석하여 태그를 자동 제안한다.

### UI 위치

사진 업로드 플로우에서 태그 입력 단계에 "AI 태그 제안" 버튼 추가.
제안된 태그는 칩으로 표시, 사용자가 선택/해제 가능.

### API Route

**`POST /api/ai/suggest-tags`**

Request:
```ts
{
  imageUrl: string;         // Firebase Storage URL (업로드 완료 후)
  existingTags: string[];   // 커플이 기존에 사용한 태그 목록 (일관성 유지)
}
```

Response:
```ts
{
  suggestedTags: string[];  // 3~5개 태그 제안
}
```

### UX 플로우

1. 사진 업로드 완료 후 "AI 태그 제안" 버튼 활성화
2. 버튼 클릭 → API 호출 (로딩 스피너)
3. 제안 태그를 선택 가능한 칩으로 표시
4. 사용자가 원하는 태그만 선택 → 기존 태그 입력에 추가
5. 수동 태그 입력도 여전히 가능

### 프롬프트 전략

- Vision 모델 사용 (Claude claude-sonnet-4-5-20250514 이상)
- 기존 태그 목록을 컨텍스트로 전달 → 유사한 태그명 재사용 유도
- 한국어 태그 생성 지시
- 태그는 짧고 구체적으로 (1~3 단어)

---

## 기능 3: 지출 패턴 분석/조언

### 목적

월간 가계부 데이터를 분석하여 지출 패턴 인사이트와 절약 조언을 제공한다.

### UI 위치

월간 대시보드(`/cashbook/monthly`) 하단에 "AI 분석" 섹션 추가.

### API Route

**`POST /api/ai/analyze-spending`**

Request:
```ts
{
  entries: {
    type: CashbookEntryType;
    amount: number;
    category: string;
    date: string;
    description: string;
  }[];
  year: number;
  month: number;
  budget?: {                // 예산이 설정된 경우
    categoryId: string;
    budgetAmount: number;
    category: string;
  }[];
}
```

Response (스트리밍):
```ts
// text/event-stream (SSE)
// 청크 단위로 마크다운 텍스트 전달
```

### 분석 내용

1. **카테고리별 지출 비율** — 어디에 가장 많이 썼는지
2. **예산 대비 분석** — 예산 초과/여유 카테고리
3. **전월 대비 변화** — 증감이 큰 카테고리
4. **절약 팁** — 구체적이고 실행 가능한 조언 1~2개

### UX 플로우

1. 월간 대시보드에서 "AI 분석 보기" 버튼
2. 클릭 → 스트리밍으로 분석 텍스트가 점진적으로 표시
3. 마크다운 렌더링 (리스트, 강조 등)
4. "다시 분석" 버튼으로 재생성 가능

### 프롬프트 전략

- 데이터 요약을 시스템 프롬프트에 포함
- 한국어 응답 지시
- 마크다운 포맷 지시
- 커플 앱 맥락 반영 (공동 지출 vs 개인 지출 구분)

---

## 환경 변수

```env
# apps/web/.env.local에 추가
ANTHROPIC_API_KEY=sk-ant-...
```

> 이 값은 **서버 사이드 전용** (NEXT_PUBLIC_ 접두사 없음).
> 클라이언트에 노출되지 않는다.

---

## 사용량 제한

과도한 API 비용을 방지하기 위해 사용량을 제한한다.

- **일일 제한**: 커플당 50회/일 (3개 API 합산)
- **저장 위치**: `couples/{coupleId}/meta/aiUsage`
- **필드**: `{ date: string, count: number }`
- **초과 시**: `{ error: "일일 사용 한도를 초과했습니다" }` (429)

---

## 비용 추정

| 기능 | 모델 | 입력 토큰 | 출력 토큰 | 건당 비용 (약) |
|------|------|----------|----------|--------------|
| 자연어 파싱 | Haiku | ~200 | ~100 | $0.001 |
| 사진 태깅 | Sonnet | ~1000 (이미지) | ~100 | $0.01 |
| 지출 분석 | Sonnet | ~500 | ~500 | $0.01 |

**월 예상**: 커플 1쌍이 매일 사용 시 약 $5~10/월

---

## 테스트 전략

- E2E 테스트에서는 **AI API를 모킹**한다
- API Route 단위 테스트: 프롬프트 구성, 응답 파싱 로직 검증
- 모킹 방식: `.env.test`에 `USE_AI_MOCK=true` 설정 → 고정된 응답 반환
