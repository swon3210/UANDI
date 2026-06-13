# 페이지 명세: 가계부 고정 지출·수입 알림 (정기거래 리마인더)

## 목적

월세·보험·구독·정기 급여처럼 **매월 정해진 시점에 반복되는 거래**를, 카테고리에 발생 주기를
지정해 두면 그 날짜에 맞춰 자동으로 푸시 알림을 보내 "기록 잊지 않게" 한다.

`cashbook-notifications.md`(예산 초과 경고)의 후속 사이클로 명시된 **"정기거래 체크"**를 구현한다.
이번 사이클은 **리마인더(알림)까지**만 다루고, 알림에서 바로 거래를 기록하는 **퀵 입력은 후속 사이클**로
분리한다.

> 핵심 설계 결정(유저 지시): 별도 "정기거래" 엔티티를 새로 만들지 않고, **카테고리 문서에 발생 주기
> (`recurrence`)를 직접 부착**한다. 고정 지출/수입은 본래 카테고리 단위로 관리되므로, 카테고리가
> "언제 발생하는지"를 함께 들고 있는 것이 가장 자연스럽다.

---

## 용어 정리 (기존 모델과의 매핑)

| 사용자 표현 | 코드상 subGroup  | 비고                                          |
| ----------- | ---------------- | --------------------------------------------- |
| 고정 지출   | `fixed_expense`  | 월세·금융비용·보험·공과금·구독 등 (이미 존재) |
| 고정 수입   | `regular_income` | 정기 급여 등 (이미 존재)                      |

`recurrence` 필드 자체는 모든 카테고리에 둘 수 있지만, **편집 UI는 위 두 subGroup에서만 노출**한다.
(변동 지출/유연 지출에 정기 알림을 거는 것은 의미가 약하므로.)

---

## 사용자 스토리

- 커플로서, 매월 25일 월세가 빠지기 전에 알림을 받아 잔고를 확인하고 싶다.
- 커플로서, 카드값이 매월 둘째 주 수요일에 자동이체되는 걸 잊지 않게 그 시점에 알림받고 싶다.
- 커플로서, 매월 10일 급여(고정 수입)가 들어오는 날 "가계부에 기록하세요" 알림을 받고 싶다.
- 커플로서, 발생 당일이 아니라 **며칠 전 미리** 알림받아 자금을 준비하고 싶다.
- 커플로서, 정기 알림이 부담스러우면 설정에서 한 번에 끌 수 있어야 한다.

---

## 데이터 모델

### 1. `RecurringSchedule` (신규) — 카테고리에 부착

`packages/cashbook-core/src/types.ts`에 추가하고, `CashbookCategory`에 선택 필드로 부착한다.

```ts
export type RecurringScheduleKind = 'dayOfMonth' | 'nthWeekday';

export type RecurringSchedule = {
  /** 정기 알림 on/off. false면 발생일 데이터는 보존하되 알림을 보내지 않는다. */
  enabled: boolean;

  /** 발생일 지정 방식 */
  kind: RecurringScheduleKind;

  // ── kind === 'dayOfMonth' ──
  /** 1~31. 해당 월에 그 날이 없으면(예: 31일/2월) 그 달 마지막 날로 clamp. */
  dayOfMonth?: number;

  // ── kind === 'nthWeekday' ──
  /** 몇째 주: 1~5, 또는 -1(마지막 주) */
  week?: 1 | 2 | 3 | 4 | 5 | -1;
  /** 요일: 1=월 ~ 7=일 (recordReminder.days와 동일 컨벤션) */
  weekday?: number;

  /** 발생일 며칠 전에 알림을 보낼지. 0 = 당일. 0~7. 미지정 시 0. ⚙️ */
  leadDays?: number;

  /** 예상 금액(선택). 있으면 알림 본문에 노출. 없으면 금액 없는 리마인더. ⚙️ */
  expectedAmount?: number | null;
};
```

`CashbookCategory`에 추가:

```ts
export type CashbookCategory = {
  // ...기존 필드...
  /** 정기 발생 주기. fixed_expense / regular_income에서만 설정. 미설정이면 정기 알림 없음. */
  recurrence?: RecurringSchedule | null;
};
```

> **⚙️ 설계 결정 — 발생일 정밀도**: `dayOfMonth`(매월 며칠) **와** `nthWeekday`(매월 몇째 주 + 요일)
> **둘 다** 지원한다. 카드 자동이체("둘째 주 수요일")와 고정일("매월 25일")을 모두 정확히 표현하기
> 위함. 더 단순하게 가려면 `dayOfMonth`만 남길 수 있다.

> **⚙️ 설계 결정 — 리드 타임**: 발생일 며칠 전 알림 여부를 **카테고리별 `leadDays`**로 둔다(기본 당일).
> 스케줄이 이미 카테고리에 있으니 같은 자리에 두는 것이 자연스럽다. 전역 설정으로 통일하려면
> `NotificationSettings`로 옮길 수 있다.

> **⚙️ 설계 결정 — 예상 금액 / 퀵 입력**: `expectedAmount`(선택)만 두고 알림 본문에 노출한다.
> 알림에서 바로 거래를 만드는 퀵 입력은 이번 범위에서 제외(후속). 데이터상 `expectedAmount`가 그
> 기반이 된다.

### 2. `NotificationSettings` 확장

`apps/web/src/types/index.ts`의 `NotificationSettings`에 토글 1개 추가:

```ts
export type NotificationSettings = {
  // ...기존 필드(recordReminder, budgetWarning)...
  /** 고정 지출·수입 정기 알림 on/off. 미지정 시 true 취급(기존 유저 호환). */
  recurringTransaction?: {
    enabled: boolean;
  };
  updatedAt: Timestamp;
};
```

**Firestore 경로**: 기존과 동일 `users/{userId}/settings/notifications`

### 3. 발송 로그 (중복 발송 방지)

cron 재시도/중복 실행 시 같은 날 두 번 보내지 않도록 요약 문서 하나로 멱등성을 보장한다.

```ts
// couples/{coupleId}/meta/recurringReminders
type RecurringReminderLog = {
  /** categoryId → 마지막으로 알림 보낸 날짜 'YYYY-MM-DD' */
  lastFiredOn: Record<string, string>;
  updatedAt: Timestamp;
};
```

조회 1회 + 발송 시 쓰기 1회. (CLAUDE.md의 요약 문서 패턴 준수, 전체 스캔 회피)

---

## 발생일 판정 로직 (순수 함수)

`packages/cashbook-core`에 순수 함수로 둔다(web에서 dayjs로 사용, date-fns 금지).
Cloud Functions는 cashbook-core(web SDK 패키지)를 import할 수 없으므로, 동일 로직을
의존성 없이 plain `Date`(Asia/Seoul 보정)로 재구현한다 — 두 구현의 판정 결과는 일치한다.

```ts
/** 주어진 '오늘'(local) 기준으로 이 스케줄이 오늘 알림을 보내야 하는지 판정 */
export function shouldFireOn(schedule: RecurringSchedule, today: Dayjs): boolean;
```

규칙:

1. `enabled !== true` → false
2. 이 달의 **발생일(occurrence date)**을 계산:
   - `kind === 'dayOfMonth'`: `min(dayOfMonth, 해당 월 마지막 날)`
   - `kind === 'nthWeekday'`: 그 달에서 `week`번째 `weekday`. `week === -1`이면 마지막 해당 요일.
3. **알림일 = 발생일 − `leadDays`** (dayjs로 월 경계 넘어가는 것도 자연 처리)
4. `today`가 알림일과 같은 날이면 → true

> 엣지 케이스: `leadDays`로 알림일이 **전월로 넘어가는** 경우(예: 1일 발생 + leadDays 3 → 전월 말).
> dayjs subtract로 자연 처리되며, cron이 매일 도므로 전월 말에 정상 발화한다.

---

## 푸시 알림 (FCM) — Cloud Functions

### 함수: `recurringTransactionReminder` (신규, scheduled)

`functions/src/notifications/recurringReminder.ts` 신규.
기존 `crawlSchedule.ts`의 `onSchedule` 패턴과 `budgetAlert.ts`의 FCM 전송 패턴을 따른다.

```ts
export const recurringTransactionReminder = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3',
  },
  async () => {
    /* ... */
  }
);
```

실행 흐름:

1. `db.collectionGroup('cashbookCategories').where('recurrence.enabled', '==', true).get()`
   로 정기 알림이 켜진 카테고리만 조회 (전체 스캔 회피, COLLECTION_GROUP 필드 인덱스 필요)
2. 각 카테고리에 대해 `shouldFireOn(recurrence, todaySeoul)` 평가 → 오늘 발화 대상만 추림
3. `categoryId`의 부모 경로(`ref.parent.parent.id`)로 `coupleId` 추출, coupleId별로 그룹핑
4. coupleId마다:
   - `couples/{coupleId}/meta/recurringReminders` 읽어 오늘 이미 보낸 카테고리는 skip (멱등성)
   - `couples/{coupleId}` 문서에서 `memberUids` 조회
   - 각 멤버의 `users/{uid}/settings/notifications` 읽어
     `recurringTransaction?.enabled === false`면 skip
   - `users/{uid}/fcmTokens`의 토큰들로 `sendEachForMulticast` 발송
   - 성공 시 `meta/recurringReminders.lastFiredOn[categoryId] = 'YYYY-MM-DD'` 갱신

> **수신자 정책**: 고정 지출/수입은 커플 공동 관심사이므로 **커플 양쪽 모두에게** 발송.
> (소유자 개념이 있는 개인 카테고리라도 알림은 양쪽 — 추후 필요 시 ownerUid 한정 옵션 추가)

`functions/src/index.ts`에 export 추가:

```ts
export { recurringTransactionReminder } from './notifications/recurringReminder';
```

### 푸시 메시지 형식

| 종류             | 제목         | 본문 (expectedAmount 있음)                           | 본문 (없음)                            |
| ---------------- | ------------ | ---------------------------------------------------- | -------------------------------------- |
| 고정 지출 당일   | UANDI 가계부 | 오늘은 {카테고리} 낼 날이에요 · 약 {금액}원 💸       | 오늘은 {카테고리} 낼 날이에요 💸       |
| 고정 지출 N일 전 | UANDI 가계부 | {N}일 후 {카테고리} 예정 · 약 {금액}원 💸            | {N}일 후 {카테고리} 예정이에요 💸      |
| 고정 수입 당일   | UANDI 가계부 | 오늘은 {카테고리} 들어오는 날이에요 · 약 {금액}원 💰 | 오늘은 {카테고리} 들어오는 날이에요 💰 |
| 고정 수입 N일 전 | UANDI 가계부 | {N}일 후 {카테고리} 예정 · 약 {금액}원 💰            | {N}일 후 {카테고리} 예정이에요 💰      |

### 푸시 클릭 시 동작

- 가계부 거래 추가 화면으로 이동. `data.click_action`에 카테고리를 prefill할 수 있는 경로 전달
  (예: `/cashbook/history?addCategory={categoryId}`). 퀵 입력 후속 사이클의 진입점이 된다.

---

## UI 구성

### 1. 카테고리 편집 폼 (`CategoryForm.tsx`)에 "정기 발생" 섹션 추가

- **노출 조건**: `subGroup === 'fixed_expense' || subGroup === 'regular_income'`
- zod 스키마에 `recurrence` 객체 추가 (조건부 검증: enabled일 때만 발생일 필수)
- 폼 구성 (모두 shadcn `<Form>` + `@uandi/ui` 컴포넌트 사용, 직접 `<input>` 금지):

```
┌ 정기 발생 ─────────────────────────┐
│ [토글] 이 카테고리 정기 알림 받기      │
│                                    │
│ 발생 주기   ( ) 매월 며칠   ( ) 매월 몇째 주
│                                    │
│ ─ 매월 며칠 선택 시 ─               │
│   매월 [ 25 ] 일                    │
│                                    │
│ ─ 매월 몇째 주 선택 시 ─            │
│   [ 둘째 ▾ ] 주  [ 수요일 ▾ ]       │
│                                    │
│ 미리 알림   [ 당일 ▾ ] (당일~7일 전) │
│ 예상 금액(선택) [        ] 원        │
└────────────────────────────────────┘
```

- 주차 선택: 첫째/둘째/셋째/넷째/다섯째/마지막(-1)
- 요일 선택: 월~일 (1~7)
- `enabled` 토글 off면 발생일 입력은 disabled, 알림 미발송 (데이터는 보존)

### 2. 알림 설정 페이지에 토글 추가 (`NotificationSettingsForm.tsx`)

- 기존 폼에 "고정 지출·수입 알림" 토글 1개 추가 → `recurringTransaction.enabled`
- off면 cron이 발송 단계에서 skip

### 3. (선택) 카테고리 리스트에 정기 배지

- `CategoryList` / `CategoryItem`에서 `recurrence?.enabled`인 카테고리에 작은 배지("매월 25일" 등)
  표시. 이번 사이클 필수는 아니며 여력 있으면 포함.

---

## 분리해 둘 컴포넌트 (Storybook 단계)

1. `RecurringScheduleFields` — 폼 내부 "정기 발생" 섹션 (presentational, RHF field 연결)
   - 스토리: 비활성/매월며칠/몇째주/예상금액 있음·없음
2. `RecurringBadge` — 카테고리 리스트용 "매월 N일" / "둘째 주 수요일" 배지
   - 스토리: dayOfMonth, nthWeekday, leadDays 표기, disabled

순수 표시 유틸 `formatRecurrence(schedule): string`("매월 25일", "둘째 주 수요일 · 3일 전")도
`cashbook-core`에 두고 배지/알림에서 공유.

---

## E2E 테스트 시나리오 (`apps/web/e2e/specs/cashbook-recurring-alerts.spec.ts`)

> 클라이언트에서 검증 가능한 범위(폼 입력·저장·복원·설정 토글)를 다룬다.
> cron→FCM 발송 자체는 Functions 단위 테스트(`shouldFireOn`)로 분리.

1. fixed_expense 카테고리 편집 → "매월 25일 · 예상 800,000원" 저장 → 재진입 시 값 복원
2. nthWeekday("둘째 주 수요일") 저장 → 복원
3. enabled 토글 off 저장 → 발생일 값은 유지되되 배지/알림 비활성 표시
4. variable_common 등 비대상 subGroup에서는 "정기 발생" 섹션이 **보이지 않음**
5. 알림 설정 페이지에서 "고정 지출·수입 알림" 토글 off → 저장 → 복원
6. (배지 구현 시) 카테고리 리스트에 "매월 25일" 배지 노출

### Functions 단위 테스트 (`shouldFireOn`)

- dayOfMonth=31, 2월 → 말일(28/29)로 clamp 발화
- nthWeekday week=-1(마지막 주) 정확 계산
- leadDays=3, 발생 1일 → 전월 말에 발화
- enabled=false → 항상 false

---

## 구현 위치 요약

### 공유 (cashbook-core)

- `packages/cashbook-core/src/types.ts` — `RecurringSchedule`, `RecurringScheduleKind`, `CashbookCategory.recurrence`
- `packages/cashbook-core/src/utils/recurrence.ts` (신규) — `shouldFireOn`, `formatRecurrence`, 발생일 계산
- `packages/cashbook-core/src/index.ts` — export 추가

### 클라이언트 (web)

- `apps/web/src/types/index.ts` — `NotificationSettings.recurringTransaction`
- `apps/web/src/components/cashbook/CategoryForm.tsx` — 정기 발생 섹션
- `apps/web/src/components/cashbook/RecurringScheduleFields.tsx` (신규) + 스토리
- `apps/web/src/components/cashbook/RecurringBadge.tsx` (신규, 선택) + 스토리
- `apps/web/src/components/cashbook/NotificationSettingsForm.tsx` — 토글 추가
- 카테고리 생성/수정 서비스 — `recurrence` 필드 저장 (cashbook-categories 서비스)

### Cloud Functions

- `functions/src/notifications/recurringReminder.ts` (신규) — `recurringTransactionReminder`
- `functions/src/index.ts` — export 추가

### 인프라

- Firestore 필드 인덱스(COLLECTION_GROUP): `cashbookCategories` collectionGroup `recurrence.enabled` (`firestore.indexes.json` fieldOverrides에 추가됨)
- (배포 후 검증) Cloud Scheduler 매일 09:00 KST 발화 확인

---

## 후속 사이클 (이번 작업 제외)

- **현금흐름 캘린더 통합**: `recurrence`를 현금흐름 잔액 예측의 단일 선언 출처로 사용 → [`cashflow-recurrence-integration.md`](./cashflow-recurrence-integration.md)
- **알림에서 퀵 입력**: 알림 클릭/액션으로 `expectedAmount` 기반 거래 자동 생성
- **소유자 한정 발송 옵션**: 개인 고정 지출은 본인에게만
- **다회 발생**: 주 2회·격주 등 월 1회 외 주기
- **연체 감지**: 발생일 +N일까지 해당 카테고리 거래가 없으면 "아직 기록 안 됐어요" 재알림
