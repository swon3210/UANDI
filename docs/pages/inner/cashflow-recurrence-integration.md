# 설계 명세: 현금흐름 캘린더 ↔ 고정 지출/수입 정기 발생(recurrence) 통합

## 목적

같은 개념("고정 수입/지출이 매월 언제 얼마")을 다루는 **세 메커니즘이 따로 노는 것**을 통합한다.
카테고리의 `recurrence`(고정 지출/수입 정기 발생)를 **단일 선언 출처(source of truth)** 로 삼아,
현금흐름 캘린더의 잔액 예측이 이를 직접 파생해 쓰도록 한다.

관련 선행 문서: [`cashbook-recurring-alerts.md`](./cashbook-recurring-alerts.md) (recurrence 데이터 모델·알림 정의)

---

## 배경 — 현재 분리된 3개 메커니즘

|        | ① 현금흐름 결제일 `paydays`             | ② 카테고리 `recurrence`                                               | ③ 자동 예측 `auto`                     |
| ------ | --------------------------------------- | --------------------------------------------------------------------- | -------------------------------------- |
| 저장   | `meta/cashflow.paydays[]`               | `cashbookCategories/{id}.recurrence`                                  | `cashbookPredictions/` (런타임 생성)   |
| 데이터 | `{ label, dayOfMonth }` (**금액 없음**) | `{ dayOfMonth/nthWeekday, leadDays, expectedAmount }` (**금액 있음**) | 과거 내역에서 **추론**                 |
| 입력   | `CashflowSettingsForm`                  | `CategoryForm` / `RecurringScheduleFields`                            | (사용자 입력 없음)                     |
| 소비   | 캘린더 **카드 경계만**                  | **푸시 알림**(`functions/.../recurringReminder.ts`)                   | 캘린더 **잔액 예측** + 가계부 프롬프트 |

### 문제

- **②는 잔액 예측에 전혀 안 쓰인다.** 사용자가 선언한 발생일·금액(`expectedAmount`)이 캘린더 예측에 반영되지 않는다.
- 캘린더 예측은 **①(경계만) + ③(과거 추론)** 으로 굴러간다 — 사용자가 명시한 사실 대신 과거에서 다시 추론한다.
- 결과적으로 "월세 5일 50만원"을 알림용(②)·캘린더 경계용(①) **두 곳에 입력**해야 하고, 50만원은 ③이 우연히 잡을 때만 예측에 반영된다.

---

## 설계 결정

### D1. 단일 선언 출처 = 카테고리 `recurrence`

고정 수입/지출의 "매월 언제 얼마"는 **카테고리에만** 선언한다. 캘린더는 이를 파생해 쓴다.
별도 엔티티(결제일/예측 doc)를 추가로 유지하지 않는다.
(이는 `cashbook-recurring-alerts.md`의 핵심 결정 "정기 발생을 카테고리에 부착"의 자연스러운 확장이다.)

### D2. 캘린더 예측은 **읽기 시점 파생(read-time derivation)** — Firestore 쓰기 없음

`useCashflowCalendar`가 카테고리를 읽어, recurrence가 있는 고정 카테고리마다 호라이즌(3개월) 내
발생일에 **합성 예측 거래(synthetic transaction)** 를 즉석 계산해 잔액 합산에 넣는다.
**예측 doc을 persist하지 않는다.**

> **왜 persist가 아니라 파생인가**: ②를 ③처럼 예측 doc으로 복제하면 카테고리 수정 시 동기화·마이그레이션·
> 이중 dedup이 필요하다. 파생은 카테고리가 곧 source of truth라 항상 일관되고, confirm/reject 머신을
> 건드리지 않는다. 합성 거래는 **잔액 예측 입력 전용**이고, 사용자가 실제 내역을 기록하면 자동으로 사라진다(G1).

발생일 계산은 `packages/cashbook-core/src/utils/recurrence.ts`의 **`occurrenceDateInMonth(schedule, monthAnchor)`** 를
재사용한다 (알림 cron과 동일 primitive → 두 기능의 발생일이 구조적으로 일치).

### D3. 예측 포함 기준

합성 거래로 포함하는 카테고리 조건:

1. `subGroup === 'fixed_expense' || 'regular_income'`
2. `recurrence.enabled === true`
3. `recurrence.expectedAmount`가 **양수**(숫자, > 0)

- 금액(`expectedAmount`)이 없는 recurrence는 **알림만** 보내고 캘린더 예측에는 빠진다 (금액 미상이라 잔액에 못 넣음).
- income 카테고리 → inflow, expense 카테고리 → outflow (category.group으로 판정).

> **⚙️ enabled 결합에 대한 결정(v1)**: 예측 포함을 알림 토글 `enabled`에 묶는다. "예측엔 넣되 알림은
> 끄고 싶다"는 분리 요구는 v1 범위 밖이며, 필요 시 `recurrence.includeInForecast` 필드를 후속에 추가한다.
> (대안: `enabled`와 무관하게 schedule+amount만 있으면 포함 — 더 정확하지만 "알림 껐는데 예측에 남네" 혼선 가능.
> v1은 단일 토글의 단순함을 택한다.)

### D4. paydays(①)의 운명 — 단계적 폐지 → **Phase 2 완료**

- **Phase 1**: ①은 그대로 둔다(카드 경계 생성 유지). 합성 거래는 기존 경계(결제일 또는 주 단위 폴백) 안에 떨어진다.
- **Phase 2(완료)**: 카드 경계를 recurrence 발생일에서 파생(`recurrenceBoundaries`). `CashflowSettingsForm`의
  **수동 결제일 입력 UI를 폐지**했다(현금 + 변동지출 기간만 남김). **기존 `paydays` 데이터는 경계로 계속 사용**한다
  (`mergeBoundariesByDate`로 recurrence 경계와 병합) — 별도 마이그레이션 없이 하위호환 유지. recurrence·payday
  경계가 모두 없으면 주 단위 폴백.
  - `CashflowSettings.paydays` 필드는 타입·문서에 잔존(레거시 경계 소스). 설정 저장은 `setDoc(merge:true)`라
    폼이 paydays를 보내지 않아도 기존 값이 보존된다.

recurrence는 `nthWeekday`까지 표현하므로 `dayOfMonth`만 지원하던 ①의 기능적 상위호환이다.

---

## 이중계산 방지 규칙 (핵심)

합성 거래는 잔액에 **한 번만** 잡혀야 한다. 캘린더 잔액은 현재 `actual entry + 'predicted' prediction`만
합산한다(confirmed/rejected 제외, SYNC-03). 여기에 합성 거래를 더하므로 아래 게이트가 필수다.

### G1. 합성 거래 vs 실제 내역(같은 달·같은 카테고리)

해당 발생월에 **같은 카테고리 이름**의 actual `cashbookEntry`(또는 confirmed prediction)가 이미 있으면,
그 달 발생분 합성 거래는 **생성하지 않는다**. (사용자가 이미 기록 → 실거래로 잔액 반영됨.)

- 매칭 키: 카테고리 **이름**(`CashbookEntry.category`는 이름 문자열) + `YYYY-MM`.
- 한 달에 같은 카테고리 내역이 여러 건이어도 "1건 이상 존재"면 그 달 합성분 제외(고정비는 월 1회 가정).

### G2. 합성 거래 vs 활성 예측(같은 카테고리) — **유지(축소)**

> **Phase 5에서 자동감지(③)가 제거됨**: `source:'auto'` 예측은 조회 단계에서 제외되므로, G2가 보는 활성 예측은
> 이제 사용자가 캘린더에서 직접 만든 **`calendar`(수동) 예측뿐**이다. 아래 Phase 3 항목은 자동감지가 있던
> 시기의 기록(역사적 맥락)으로, 현재는 불필요하다.

- 읽기 시점에, 활성 예측(status `predicted`) 중 같은 카테고리 이름이 같은 달에 있으면 그 달 합성분을 제외한다.
- ~~**Phase 3(완료)**: `useAutoPredictions`(③)가 **선언된 recurrence가 있는 카테고리는 패턴 감지에서 제외**한다.~~
  → Phase 5에서 자동감지 자체가 제거되어 무의미해짐.

> **G2를 제거하지 않고 유지한 이유(스펙 대비 정제)**: G2를 auto 한정이 아니라 _모든_ 활성 예측 대상으로 두면,
> 사용자가 캘린더에서 같은 달·같은 카테고리에 **수동 예측(`source==='calendar'`)** 을 추가한 경우에도
> 이중계산을 막는다(수동 입력이 더 구체적 → 수동이 우선, 합성 보류). Phase 3로 auto 중복은 원천 차단되지만
> 수동 예측 케이스가 남으므로 G2는 상시 가드로 둔다.
>
> ③의 패턴 감지(`detectRecurringPatterns`)는 카테고리 **이름**으로 그룹핑하므로, 제외 판정도 이름 기준
> (`${group}|${name}` 집합을 `useAutoPredictions`에 주입해 필터).

### G3. 호라이즌·정렬

- 발생 인스턴스는 `from`(오늘 0시)부터 `CASHFLOW_HORIZON_MONTHS`(3개월) 내, 오늘 포함 이후만.
- `dayOfMonth`가 말일 초과면 말일로 clamp(이미 `occurrenceDateInMonth`가 처리).

---

## 합성 거래의 표현

`buildCashflowCards`의 입력 `CashflowTransaction`로 변환한다. 기존 필드 재사용(타입 변경 불필요):

```ts
{
  id: `recurrence-${categoryId}-${YYYY-MM-DD}`, // 결정적, 키 충돌 방지
  kind: 'predicted',
  type: category.group,            // 'income' | 'expense'
  amount: recurrence.expectedAmount,
  category: category.name,
  description: '',                 // 또는 formatRecurrence(schedule)
  date: occurrence,
  source: 'calendar',              // 표시상 ◇ 예측. (신규 source 'recurrence'는 도입하지 않음 — UI 분기 불필요)
}
```

> 카드 UI(`CashflowTransactionRow`)는 `kind === 'predicted'`를 ◇로 표시하므로 추가 UI 변경 없이 자연스럽게 노출된다.
> 합성 거래는 doc이 없어 confirm/reject 대상이 아니다 — 실제 기록 시 G1로 사라지는 것이 "확정"에 해당한다.

---

## Phase 1 구현 범위 (이번 사이클)

읽기 시점 파생 + G1 + G2(과도기). 경계(①)·③ 수정은 손대지 않는다.

### 신규 순수 함수 (web utils, firebase 비의존)

`apps/web/src/utils/cashflow.ts`에 추가 (Storybook/단위테스트 가능):

```ts
/** recurrence 있는 고정 카테고리들 → 호라이즌 내 합성 예측 거래. G1/G2 게이트 적용. */
export function buildRecurrenceTransactions(
  categories: CashbookCategory[],
  opts: {
    from: Dayjs;
    months: number;
    /** G1: 같은 달 실거래가 있는 (categoryName) 집합 — `${categoryName}|${YYYY-MM}` */
    actualKeys: Set<string>;
    /** G2(과도기): 같은 달 활성 auto 예측이 있는 집합 — `${categoryName}|${YYYY-MM}` */
    activePredictionKeys: Set<string>;
  }
): CashflowTransaction[];
```

### `useCashflowCalendar` 수정

- `useCashbookCategories(coupleId)`로 카테고리 로드.
- 이미 조회 중인 `entries`(호라이즌 내 실거래)로 `actualKeys` 구성.
- `predictions`(활성)로 `activePredictionKeys` 구성(`source==='auto'`만).
- `buildRecurrenceTransactions(...)` 결과를 기존 `txns`에 concat 후 `buildCashflowCards`에 전달.

### 변경 없음

- Firestore 스키마/쓰기 없음. `paydays`·③·알림 cron·예측 doc 머신 모두 불변.

---

## E2E / 테스트

> 이 프로젝트는 별도 단위 테스트 러너(vitest 등)가 없고 **Playwright E2E + Firebase 에뮬레이터**가 표준이다.
> 아래 케이스는 모두 E2E로 커버한다. 순수 함수 의도(참고용):
>
> 1. dayOfMonth=5, expectedAmount=500000 → 발생월마다 1건, 금액·type 정확.
> 2. expectedAmount 없음/0 → 생성 안 함. 3. `enabled=false` → 생성 안 함.
> 3. nthWeekday(둘째 주 수요일) → 각 달 정확한 날짜.
> 4. **G1**: 같은 달 같은 이름 실거래 존재 → 그 달 합성 제외. 6. **G2**: 같은 달 활성 예측 존재 → 제외.
> 5. dayOfMonth=31, 2월 → 말일 clamp.

### E2E (`apps/web/e2e/specs/cashflow-recurrence.spec.ts`)

1. fixed_expense 카테고리에 "매월 5일 · 50만원" 설정 → 현금흐름 캘린더에 해당 날짜 ◇ 예측 outflow로 노출, 잔액 반영.
2. regular_income "매월 25일 · 300만원" → inflow ◇로 노출.
3. 그 달 해당 카테고리 실거래 입력 후 → 캘린더에서 합성 ◇가 사라지고 실거래 ✓만 남음(이중계산 없음, G1).
4. expectedAmount 없는 recurrence → 알림 대상이지만 캘린더 예측엔 미노출.

---

## Phase 2 구현 (완료)

카드 경계를 recurrence 발생일에서 파생 + 수동 결제일 UI 폐지(레거시 paydays는 경계로 잔존).

- `cashflow.ts`: `buildRecurrenceOccurrences`(게이트 미적용 발생 인스턴스) → `recurrenceTransactions`(G1/G2 적용
  합성 거래)·`recurrenceBoundaries`(체크포인트 경계)로 분리. `mergeBoundariesByDate`로 payday·recurrence 경계 병합.
- `useCashflowCalendar`: 경계 = `mergeBoundariesByDate(paydayB, recurrenceB)`, 둘 다 없으면 주 단위 폴백.
- `CashflowSettingsForm`: 결제일 입력 섹션 제거(현금 + 변동지출 기간만). 카테고리 정기 발생 안내 문구 추가.
- `cashflow-settings.ts`: `CashflowSettingsInput.paydays`를 optional로(merge 저장이라 기존 값 보존).
- E2E: 결제일 없이 recurrence 발생일이 날짜 체크포인트 카드가 되는지 검증.

## Phase 3 구현 (완료)

`useAutoPredictions`가 선언된 recurrence 카테고리(`${group}|${name}`)를 `detectRecurringPatterns` 결과에서 제외.
auto 예측 ↔ 선언 합성의 중복을 생성 단계에서 차단. (G2는 수동 예측 가드로 유지 — 위 G2 참고.)

- E2E: 같은 카테고리에 정기 발생 선언 + 과거 반복 내역 → 캘린더엔 선언 파생 ◇만, '자동감지' 예측·가계부 점선 박스 없음.

## Phase 4 구현 (완료) — 내역 페이지 정기 발생 프롬프트

정기 발생을 **현금흐름 캘린더처럼 내역 페이지(`/inner/cashbook/history`)의 "예상 수입/지출" 점선 박스로도**
읽기 시점에 파생해 띄운다. (배경: Phase 3로 선언 카테고리는 자동감지 프롬프트가 사라져, 선언 항목의
"예상 → 기록" 흐름이 내역 페이지에서 비어 있었음.)

### 동작

- **소스**: `useRecurrencePrompts` — 카테고리 recurrence에서 `buildRecurrenceOccurrences`로 발생일 도출.
  표시 구간 = `[오늘, 표시 중인 달 말]`(과거 달이면 비어 있음). 즉 `useDayPredictions`와 동일하게 `date >= 오늘`.
- **게이트**: G1(같은 달·같은 카테고리 실거래 존재 → 제외), G2(같은 달 활성 예측 doc 존재 → 제외).
  doc-기반 프롬프트(`useDayPredictions`)와 같은 날짜에 합쳐 렌더하되 중복은 G2로 방지.
- **표현**: 기존 `PredictionPromptBox`(점선 ◇)를 재사용. `kind:'recurrence'` 뷰는 배지를 **"정기"** 로,
  보조줄에 `매월 N일`(또는 `둘째 주 수요일`, `formatRecurrence`) 표기.
- **액션**: **"기록하기"(예상값 그대로 원탭 기록)** + **"수정 후 기록"(prefill된 `EntryForm`을 열어 금액 등 조정 후 저장)**.
  발생 시점에 금액이 달라질 수 있어 두 경로를 둔다. doc이 없으므로 confirm/reject 머신을 타지 않고 바로 `addEntry`로 기록한다.
  - **✗(아니오)·이번 달 건너뛰기 없음**: 읽기 시점 파생이라 "그냥 제거"는 새로고침 시 되살아난다. 제거를
    영속화하려면 별도 skip 저장이 필요한데, 그 비용 대비 가치가 낮다. 대신 **기록하면(G1) 또는 발생일이
    지나면(`date >= 오늘` 필터) 자동 소멸**한다.

### 구현 위치

| 파일                                                       | 변경                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `apps/web/src/hooks/useRecurrencePrompts.ts`               | 신규 — recurrence → 날짜별 프롬프트 뷰(Map), G1/G2 게이트                                         |
| `apps/web/src/components/cashbook/PredictionPromptBox.tsx` | `kind:'recurrence'` 변형(단일 "기록하기", "정기" 배지, ✗/수정 숨김). `onReject`/`onEdit` optional |
| `apps/web/src/app/inner/cashbook/(main)/history/page.tsx`  | recurrence 프롬프트를 day 섹션에 병합, `kind`로 핸들러 분기(기록=prefill 추가)                    |
| E2E                                                        | 내역 페이지에 정기 발생 "예상 수입" 프롬프트 노출 + 기록 흐름                                     |

### 알려진 한계

- 발생일이 지나도록 기록하지 않으면 프롬프트가 조용히 사라진다(회고 배너는 doc 예측 전용). 당일 푸시 알림이
  보완. 추후 필요 시 미기록 정기 발생 회고를 별도로 다룬다.

## Phase 5 구현 (완료) — 자동감지(③) 영속 예측 제거, 단일 출처 확정

선언(카테고리 recurrence)과 추론(자동감지) **두 출처를 동시에 굴리던 것**이 dedup 게이트(G1/G2)·Phase 3
스킵·**잔존 auto doc 충돌**의 근원이었다. 추론 출처를 제거해 **선언을 유일 출처로 확정**한다.

### 발견된 버그 (제거 동기)

- 자동감지로 이미 만들어진 `source:'auto'` 예측 doc은 Phase 3(신규 생성 차단) 이후에도 **삭제되지 않고 잔존**한다.
- 그 잔존 doc이 같은 달에 있으면 `useRecurrencePrompts`의 **G2가 정기 발생 프롬프트를 억제**해, 사용자가
  발생일을 새로 지정해도 내역 페이지 "기록하기"가 안 뜬다(E2E로 재현: count 0 → 수정 후 1).

### 변경

- **자동감지 생성 제거**: `useAutoPredictions` 훅 삭제 + 내역 페이지 호출 제거. 더 이상 `auto` 예측 doc을 만들지 않는다.
- **잔존 auto doc 비활성화(삭제 아님)**: `usePredictionsInRange`·`useActivePredictions`에 `select`로
  **`source==='auto'` 제외**. → 화면·잔액·dedup(G2) 어디에서도 auto doc이 보이지 않는다(파괴적 마이그레이션 회피).
- **남는 예측 = `calendar` 출처(사용자가 캘린더에서 직접 추가한 예측)뿐.** confirm/reject/dismiss 흐름(SYNC-02~05)은 그대로.
- `detectRecurringPatterns`는 **예상 변동지출 추정(§7-2)** 에서 계속 쓰이므로 유지. (`buildRecurrenceKey`·
  `nextOccurrence`·`getPredictionByRecurrenceKey`는 이제 미사용 — 후속 정리 대상.)

### 구현 위치

| 파일                                                      | 변경                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/hooks/usePredictions.ts`                    | `usePredictionsInRange`/`useActivePredictions`에 `select: excludeAutoPredictions`                                        |
| `apps/web/src/hooks/useAutoPredictions.ts`                | **삭제**                                                                                                                 |
| `apps/web/src/app/inner/cashbook/(main)/history/page.tsx` | `useAutoPredictions` 호출 제거                                                                                           |
| E2E                                                       | `cashflow-auto-detect.spec.ts`(자동감지 doc 생성·거절) 삭제, `§7-2` 테스트는 `cashflow-variable-estimate.spec.ts`로 이동 |

> **남은 dedup**: G1(실거래)·G2(이제 calendar 예측만)는 유지된다. 사용자가 같은 달·같은 카테고리에 **수동 예측**을
> 추가한 경우의 중복만 막으면 되므로 G2는 사실상 그 케이스 전용으로 단순해진다.

## Phase 6 구현 (완료) — 정기 발생 등록 제안 (영속 doc 없는 자동감지 부활)

Phase 5로 자동감지를 제거하자 **미선언 반복 항목(예: 공과금)이 예측에서 빠지는** 빈자리가 생겼다.
발견 편의를 되살리되, **영속 예측 doc은 만들지 않고** "정기 발생으로 등록할까요?" **읽기 시점 제안**으로 보완한다.
수락하면 카테고리 recurrence가 설정되어, 이후엔 선언(단일 출처) 흐름을 그대로 탄다 → 충돌 0.

### 동작

- **감지**: `detectRecurringPatterns`(과거 6개월, `MIN_OCCURRENCES=3`·`AMOUNT_TOLERANCE=0.1`·`DAY_TOLERANCE=2`) 재사용.
  flex 제외, 카테고리(이름+타입)당 가장 강한 dayOfMonth 클러스터 1개.
- **제안 대상 필터**: 패턴의 카테고리가 (a) **실제로 존재**(이름+group 매칭)하고, (b) `recurrence.enabled`가 아니며,
  (c) `recurrenceSuggestionDismissed`가 아닌 것만.
- **위치**: 현금흐름 캘린더(`/inner/cashbook/cashflow`) 카드 목록 위 제안 섹션.
- **승격(수락)**: 버튼은 타입별로 **"정기 지출 등록" / "정기 수입 등록"** 으로 명시한다. 한 번에
  `updateCategory(categoryId, { recurrence: { enabled, kind:'dayOfMonth', dayOfMonth: 감지일,
expectedAmount: 감지 평균금액 } })` + **성공 토스트**(`'{name}' 항목을 정기 지출에 등록했어요`).
  카테고리에 recurrence가 생기므로 제안은 사라지고, 캘린더 ◇·내역 프롬프트(Phase 1·4)에 자동 노출.
  값이 어긋나면 카테고리 편집에서 조정.
- **닫기(안 함)**: `updateCategory(categoryId, { recurrenceSuggestionDismissed: true })`. 영속(커플 공유),
  별도 meta doc 불필요. 다시 제안하지 않는다.

> **명시성(요청 반영)**: "등록"이 단순 버튼으로 인지되지 않는 문제를 보완해, 카드 문구("이 카테고리를 정기 지출
> 항목으로 등록하면…")·버튼 라벨("정기 지출/수입 등록")·성공 토스트로 **"정기 지출/수입으로 등록"** 임을 명확히 한다.
> (subGroup은 바꾸지 않는다 — 예산/대시보드 분류 부작용 회피. 등록 후 카테고리 목록 `RecurringBadge`로도 정기 표시.)

> **승격 방식 결정(one-tap)**: 감지값을 그대로 채워 한 번에 등록한다(폼 재확인 없음). 예측은 본래 근사값이고
> 사후 수정이 쉬우므로 마찰을 줄이는 쪽을 택했다. (대안: 등록 시 카테고리 recurrence 폼을 prefill로 열어 확인.)

### 데이터 모델 추가

`CashbookCategory`에 선택 필드:

```ts
/** 정기 발생 등록 제안을 닫았는지(읽기 시점 제안 재노출 방지). Phase 6. */
recurrenceSuggestionDismissed?: boolean;
```

### 구현 위치

| 파일                                                             | 변경                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `packages/cashbook-core/src/types.ts`                            | `CashbookCategory.recurrenceSuggestionDismissed?` 추가                                                  |
| `packages/cashbook-core/src/services/cashbook-categories.ts`     | `updateCategory` Pick에 필드 추가                                                                       |
| `apps/web/src/hooks/useCashbookCategories.ts`                    | `useUpdateCategory` Pick에 필드 추가                                                                    |
| `apps/web/src/hooks/useRecurrenceSuggestions.ts`                 | **신규** — 6개월 내역 감지 + 필터 → 제안 목록 + accept/dismiss                                          |
| `apps/web/src/components/cashbook/RecurrenceSuggestionCard.tsx`  | **신규** 프레젠테이션 + 스토리                                                                          |
| `apps/web/src/app/inner/cashbook/(standalone)/cashflow/page.tsx` | 제안 섹션 렌더                                                                                          |
| E2E                                                              | 반복 내역(미선언) → 제안 노출 → "등록" → recurrence 설정·캘린더 반영·제안 소멸 / "안 함" → 재노출 안 함 |

## Phase 7 구현 (완료) — 정기 발생 해제 제안 (역방향)

등록(Phase 6)이 과거 패턴에서 정기 발생을 **추려 넣는** 흐름이라면, 그 반대 — **원래 발생하던 정기
수입/지출이 끊겼을 때 해제를 유도**하는 흐름. 같은 제안 카드(`kind: 'remove'`)로 같은 위치에 노출한다.

### 동작

- **해제 후보 감지**: `recurrence.enabled`인 카테고리 중, 과거 6개월에 **≥2회 발생**(자리잡은 패턴)했지만
  **최근 `STOPPED_MONTHS`(2)개월간 발생이 끊긴**(가장 최근 실거래가 2개월 전보다 과거) 것. 신규 정기 발생
  (과거 내역 < 2)은 오탐 방지로 제외.
- **표현**: `kind:'remove'` 카드 — "최근 발생이 없어요. 정기 {수입/지출} 등록을 해제할까요?" + `formatRecurrence` 표기.
- **해제(수락)**: `updateCategory(categoryId, { recurrence: null, recurrenceSuggestionDismissed: false })`
  - 성공 토스트. recurrence가 사라져 캘린더 ◇·내역 프롬프트에서 빠진다. (닫음 플래그를 리셋해 추후 재등록 가능.)
- **유지(닫기)**: `recurrenceSuggestionDismissed: true`. 다시 제안하지 않는다.

> **닫음 플래그 공유**: add/remove 모두 `recurrenceSuggestionDismissed` 하나를 쓴다. 카테고리는 한 시점에
> add(미선언) 또는 remove(선언) 중 하나의 상태뿐이라 상호배타적이고, 해제 수락 시 플래그를 리셋해 재등록 경로를 연다.

### 구현 위치(추가)

| 파일                                                            | 변경                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------- |
| `apps/web/src/hooks/useRecurrenceSuggestions.ts`                | remove 후보 계산 + accept/dismiss 분기(`kind`) + 성공 토스트         |
| `apps/web/src/components/cashbook/RecurrenceSuggestionCard.tsx` | `kind:'add'                                                          | 'remove'` 변형(라벨·아이콘·버튼) |
| E2E                                                             | 끊긴 정기 발생 → 해제 제안 → "해제" 시 제거 / "유지" 시 재노출 안 함 |

## Phase 8 구현 (완료) — 반복 주기(격월/분기/반기/매년) + 예측 방식 투명화

### 배경

정기 발생이 `dayOfMonth`/`nthWeekday` **둘 다 매월 발생**만 표현할 수 있어, 상여·명절비·자동차세처럼
**띄엄띄엄 발생하는 항목이 매월 예측에 박히는** 문제가 있었다(선언 경로·LLM 추론 경로 모두). 또한 예측이
"어떤 근거로" 잡혔는지 유저에게 거의 보이지 않았다.

### D8-1. 반복 주기(interval) 도입 — 단일 primitive 확장

`RecurringSchedule`에 두 필드 추가(둘 다 optional → 기존 데이터는 매월로 하위호환):

```ts
intervalMonths?: number; // 1=매월(기본), 2=격월, 3=분기, 6=반기, 12=매년
anchorMonth?: string;    // "YYYY-MM" — interval>1일 때 위상 기준 달
```

- 발생 판정은 `isActiveMonth(schedule, monthAnchor)`(신규): `interval<=1`이면 항상, 아니면
  `((current - anchor) % interval === 0)`인 달만. anchor 미지정 시 절대 월 인덱스 위상 0 폴백(결정적).
- `occurrenceDateInMonth`가 비활성 달이면 **null 반환** → 캘린더 합성 거래·내역 프롬프트·알림 cron이
  **한 곳(primitive)** 만 고쳐도 모두 격월/분기를 존중한다(구조적 일치 유지).
- 알림 cron(`functions/.../recurringReminder.ts`)은 이 유틸을 **중복 구현**하므로 동일 `isActiveMonth`를 미러링.
- `formatRecurrence`에 주기 접두 라벨("격월 25일", "분기마다 둘째 주 수요일"). 매월은 접두 생략(기존 표기 유지).

### D8-2. LLM 추론도 주기 존중

`predict-cashflow` 프롬프트에서 "매달 1건씩 강제"를 제거하고, **과거 등장 월 간격을 그대로 유지**해
예측하도록 지시(격월 항목을 매달 넣지 말 것). `reason`에 주기를 명시하게 강화.

### D8-3. 예측 방식 투명화

- **항목별 근거**: `CashflowTransactionRow`가 예측 출처를 근거 서브라벨로 노출.
  - 정기 발생(`recurrence-` id) → `정기 발생 · 격월 25일`(합성 거래 `description`에 `formatRecurrence` 실음).
  - AI 추론(`llm-` id / `source:'llm'`) → `AI 추론 · {reason}`.
- **상단 안내**: 현금흐름 페이지에 ◇의 의미 + "정기 발생 + AI 추론으로 계산" 한 줄 설명(`cashflow-prediction-guide`).
- **편집 UI**: `RecurringScheduleFields`에 "발생 빈도"(매월/격월/분기/반기/매년) 칩 + interval>1일 때 "시작 월" 셀렉트.

### 구현 위치

| 파일                                                            | 변경                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `packages/cashbook-core/src/types.ts`                           | `RecurringSchedule.intervalMonths?` / `anchorMonth?` 추가                  |
| `packages/cashbook-core/src/utils/recurrence.ts`                | `isActiveMonth`·`INTERVAL_LABELS` 추가, `occurrenceDateInMonth`/`formatRecurrence` 확장 |
| `packages/cashbook-core/src/utils/__tests__/recurrence.test.ts` | **신규** vitest — 위상/연 경계/format 검증(9 케이스)                       |
| `functions/src/notifications/recurringReminder.ts`              | `isActiveMonth` 미러링(격월은 건너뛰는 달 알림 안 감)                      |
| `apps/web/src/utils/cashflow.ts`                                | 합성 거래 `description`에 `formatRecurrence`(근거 라벨)                    |
| `apps/web/src/components/cashbook/RecurringScheduleFields.tsx`  | 발생 빈도 칩 + 시작 월 셀렉트                                              |
| `apps/web/src/app/inner/cashbook/(standalone)/categories/page.tsx` | `buildRecurrencePayload`에 interval/anchor 반영                        |
| `apps/web/src/components/cashbook/CategoryForm.tsx`             | 스키마·기본값에 신규 필드                                                  |
| `apps/web/src/components/cashbook/CashflowTransactionRow.tsx`   | 예측 근거 서브라벨(정기 발생/AI 추론)                                      |
| `apps/web/src/app/inner/cashbook/(standalone)/cashflow/page.tsx` | 예측 방식 상단 안내                                                       |
| `apps/web/src/app/api/ai/predict-cashflow/route.ts`             | 프롬프트: 주기 리듬 존중                                                   |
| E2E `cashflow-recurrence.spec.ts`                               | 격월 정기 발생 노출 + "격월" 근거 표기                                     |

## 후속 (미포함)

- 잔존 `source:'auto'` doc 하드 삭제(현재는 조회 단계 비활성으로 무해 — 필요 시 일회성 정리 스크립트).
- (선택) 제안을 내역 페이지에도 노출(현재는 현금흐름 캘린더만).
- (선택) `recurrence.includeInForecast` 분리 플래그(알림 없이 예측만, 또는 그 반대).
- recurrence 발생일에 **금액 없는** 카테고리도 체크포인트로 둘지(현재는 `expectedAmount>0`만 경계가 됨).
- 미기록 정기 발생 회고(발생일 지난 뒤에도 "아직 기록 안 함" 안내).

---

## 구현 위치 요약 (Phase 1)

| 영역        | 파일                                                   | 변경                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------- |
| 순수 유틸   | `apps/web/src/utils/cashflow.ts`                       | `buildRecurrenceTransactions` 추가        |
| 발생일 계산 | `packages/cashbook-core/src/utils/recurrence.ts`       | 재사용(변경 없음, 필요 시 web에서 import) |
| 합성 합성   | `apps/web/src/hooks/useCashflowCalendar.ts`            | 카테고리 로드 + 합성 거래 concat          |
| 단위 테스트 | `apps/web/src/utils/cashflow.test.ts` (또는 기존 위치) | 위 7개 케이스                             |
| E2E         | `apps/web/e2e/specs/cashflow-recurrence.spec.ts`       | 위 4개 시나리오                           |

</content>
</invoke>
