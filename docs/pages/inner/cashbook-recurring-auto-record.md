# 페이지 명세: 고정 지출·수입 자동 기록 (정기 발생 → 실제 내역 자동 생성)

## 목적

카테고리에 선언한 정기 발생(`recurrence`)을 **알림·예측에서 그치지 않고 실제 가계부 내역으로 자동 기록**한다.
월세·보험·구독·정기 급여처럼 매달 금액이 같은 항목은 사용자가 손대지 않아도 발생일에 내역이 생긴다.

유저 건의(2026-11-17, feedback `Mu73kW0768my0ApxB9HF`):

> 매달 나가는 고정지출을 입력할 수 있었으면 좋겠어요. 매달 입력하지 않아도 자동으로 입력되면 좋을 것 같아요.

선행 문서:

- [`cashbook-recurring-alerts.md`](./cashbook-recurring-alerts.md) — `recurrence` 데이터 모델·발생일 판정·리마인더 cron
- [`cashflow-recurrence-integration.md`](./cashflow-recurrence-integration.md) — recurrence를 단일 선언 출처로 삼는 결정, G1/G2 이중계산 방지 규칙

이 문서는 선행 문서의 「후속 사이클 — 알림에서 퀵 입력」을 **퀵 입력이 아닌 완전 자동 기록**으로 대체한다.
(한 탭 확정 UI는 만들지 않는다 — 유저 지시: "앞으로 들어올 내역이 표시되게 하는 것만이 목적".)

---

## 사용자 스토리

- 커플로서, 월세(매월 25일 · 800,000원)를 한 번 설정해 두면 매달 25일에 내역이 자동으로 생겨 있길 바란다.
- 커플로서, 자동 기록된 내역이 어떤 것인지 알아볼 수 있어야 하고, 금액이 다르면 바로 고치거나 지울 수 있어야 한다.
- 커플로서, 자동 기록이 되면 "기록했어요" 알림을 받아 확인할 수 있어야 한다. (리마인더는 더 이상 필요 없다.)
- 커플로서, 자동 기록된 지출이 누구 지갑에서 나간 것인지(작성자) 정할 수 있어야 한다. 현금흐름의 사람별 잔액에 그대로 반영된다.
- 커플로서, 이번 달 월세를 이미 직접 기록했다면 자동 기록이 또 생기면 안 된다.
- 커플로서, 자동 기록된 내역을 지웠다면 같은 달에 다시 생기면 안 된다.

---

## 설계 결정

### D1. 자동 기록은 `recurrence`의 하위 옵션이다

별도 "정기거래" 엔티티를 만들지 않는다. `RecurringSchedule`에 `autoRecord`·`payerUid`를 추가하고,
**정기 발생(`enabled`)이 켜진 카테고리에서만** 자동 기록을 켤 수 있다.
→ cron은 기존 `recurrence.enabled == true` collection group 쿼리 하나로 리마인더·자동 기록 대상을 모두 얻는다
(새 인덱스 불필요). 자동 기록 여부는 메모리에서 `autoRecord`로 가른다.

### D2. 자동 기록 조건: 예상 금액이 양수여야 한다

`expectedAmount`가 없거나 0이면 자동 기록 토글을 켤 수 없다(UI disabled + 안내).
금액이 매달 다른 항목(공과금 등)은 사용자가 켜지 않도록 토글 아래 안내 문구를 둔다.

### D3. 생성 주체는 서버(Cloud Functions 일일 cron)

앱을 열지 않아도 발생일에 기록되어야 하므로 클라이언트가 아닌 서버가 쓴다.
기존 `recurringTransactionReminder`(매일 09:00 KST, asia-northeast3) 안에서 **자동 기록 → 리마인더** 순으로 처리한다.
함수를 둘로 나누면 "리마인더 보냈는데 자동 기록도 됨" 같은 경합이 생기므로 하나로 둔다.

### D4. 멱등성 — 결정적 문서 id + 월 단위 마커

- 내역 문서 id: `recurrence-{categoryId}-{YYYY-MM}` (`DocumentReference.create()` → 이미 있으면 실패).
- 커플 요약 문서 `couples/{coupleId}/meta/recurringAutoRecords.lastRecordedMonth[categoryId] = 'YYYY-MM'`.
  내역 생성과 마커 갱신은 **같은 batch**로 커밋한다.
- catch-up(D5)이 과거 발생분을 되짚을 때 **마커가 가리키는 달 이하는 건너뛴다.**
  → 사용자가 자동 기록을 지워도(문서가 사라져도) 같은 달에 다시 생기지 않는다.
- 결정적 id는 마커가 깨졌을 때(동시 실행 등)의 2차 방어선이다.

### D5. catch-up — 최근 7일 발생분을 되짚는다

cron이 하루 실패해도 다음 실행에서 빠진 날을 채운다. 대상 발생일 = `[오늘-6일, 오늘]` 안에 있는 발생일.
오늘보다 미래는 절대 쓰지 않는다. 토글을 **발생일이 지난 뒤 켠 경우** 그 달은 기록하지 않고 다음 발생일부터 적용된다
(7일 안이면 기록된다 — UI 안내: "발생일이 지났으면 다음 발생일부터 기록돼요").

### D6. G1 — 같은 달 같은 카테고리에 실거래가 있으면 건너뛴다

`cashbookEntries where category == name and date in [월초, 월말]` 1건 조회. 있으면 생성하지 않고 **마커만 갱신**한다
(사용자가 먼저 기록 → 다음 날 catch-up이 또 시도하지 않게).
매칭 키는 `cashflow-recurrence-integration.md` G1과 동일(카테고리 **이름** + `YYYY-MM`).

### D7. 작성자(`createdBy`) = `payerUid`

현금흐름 캘린더가 실거래를 작성자 기준으로 사람별 잔액에 귀속하므로 자동 기록에도 작성자가 필요하다.
토글을 켤 때 기록자를 고른다(기본 = 토글을 켠 사람). `payerUid`가 커플 멤버가 아니면(탈퇴 등) `memberUids[0]`으로 폴백하고 경고 로그.

### D8. 자동 기록 카테고리는 리마인더를 보내지 않는다

"3일 후 월세 예정" 리마인더는 기록을 잊지 않게 하는 용도라 자동 기록과 겹친다.
`autoRecord`가 켜진 카테고리는 리마인더 대신 **기록 완료 알림**만 받는다. UI에서도 `autoRecord`가 켜지면 「미리 알림」 입력을 숨긴다(값은 보존).

### D9. 자동 기록 내역의 표식은 데이터 필드로 둔다

`CashbookEntry.autoRecord?: { categoryId: string; month: 'YYYY-MM' }`. `description`은 빈 문자열(데이터를 더럽히지 않음).
내역 카드는 이 필드가 있으면 "자동" 배지를 붙인다. id 접두어(`recurrence-`)를 파싱하지 않는다.
사용자가 내역을 수정해도 필드는 남는다(자동으로 생긴 것이라는 사실은 변하지 않음).

### D10. 기존 메커니즘과의 관계

| 메커니즘                                        | 영향                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| 현금흐름 캘린더 합성 예측 / 내역 예상 프롬프트  | 자동 기록이 실거래이므로 **G1에 의해 그 달 합성분이 자연히 사라진다.** 코드 변경 없음. |
| 예산 초과 알림(`onCashbookEntryCreated`)        | 자동 기록도 실거래이므로 트리거된다. 의도된 동작(고정비로 예산을 넘기면 알아야 한다).  |
| 정기 발생 해제 제안(`useRecurrenceSuggestions`) | 자동 기록이 매달 내역을 만들므로 "발생이 끊김" 제안이 뜨지 않는다. 의도된 동작.        |
| 리마인더 발송 로그 `meta/recurringReminders`    | 그대로. 자동 기록 마커는 별도 문서 `meta/recurringAutoRecords`.                        |

---

## 데이터 모델

### `RecurringSchedule` 확장 (`packages/cashbook-core/src/types.ts`)

```ts
export type RecurringSchedule = {
  // ...기존 필드(enabled, kind, dayOfMonth, week, weekday, leadDays, expectedAmount, intervalMonths, anchorMonth)...
  /**
   * 발생일에 실제 내역을 자동 생성할지. enabled && expectedAmount > 0 일 때만 켤 수 있다.
   * 켜지면 리마인더 대신 기록 완료 알림을 받는다. 미지정 시 false.
   */
  autoRecord?: boolean;
  /** 자동 기록 내역의 작성자(createdBy). 커플 멤버 uid. autoRecord일 때 필수. */
  payerUid?: string | null;
};
```

### `CashbookEntry` 확장

```ts
export type CashbookEntry = {
  // ...기존 필드...
  /** 정기 발생 자동 기록으로 생성된 내역. 있으면 내역 카드에 "자동" 배지. */
  autoRecord?: { categoryId: string; month: string /* YYYY-MM */ };
};
```

**문서 id**: `recurrence-{categoryId}-{YYYY-MM}` (Admin SDK `create()`).
**date**: 발생일 **Asia/Seoul 00:00** Timestamp (앱이 `dayjs(date).toDate()`로 저장하는 로컬 자정과 같은 관례).

### 자동 기록 마커 (요약 문서)

```ts
// couples/{coupleId}/meta/recurringAutoRecords
type RecurringAutoRecordLog = {
  /** categoryId → 마지막으로 자동 기록(또는 G1로 건너뜀)한 달 'YYYY-MM' */
  lastRecordedMonth: Record<string, string>;
  updatedAt: Timestamp;
};
```

---

## Cloud Functions

### 공용 모듈 분리: `functions/src/notifications/recurrence-core.ts` (신규)

`recurringReminder.ts`에 있던 의존성 없는 날짜 로직(`seoulToday`, `isActiveMonth`, `occurrenceDate`, `shouldFireOn`,
`dateKey`)을 옮기고 아래를 추가한다. **firebase import 없이 순수 함수만** 둔다(단위 테스트 대상).

```ts
/** [today - (windowDays-1), today] 안에 있는 발생일을 오래된 순으로. 미래는 제외. */
export function occurrencesInWindow(schedule, today: Date, windowDays: number): Date[];
/** 'YYYY-MM' */
export function monthKey(d: Date): string;
/** 내역 문서 id */
export function autoRecordEntryId(categoryId: string, month: string): string;
/** Asia/Seoul 자정 → 실제 UTC 시각 (Timestamp 변환용) */
export function seoulMidnightToUtc(d: Date): Date;
/** monthKey 비교: a가 b보다 뒤인 달인가 */
export function isLaterMonth(a: string, b: string): boolean;
```

### `recurringTransactionReminder` 수정 (`recurringReminder.ts`)

실행 흐름(기존 1~2단계 뒤에 삽입):

```
1. collectionGroup('cashbookCategories').where('recurrence.enabled','==',true)   (기존)
2. coupleId별 그룹핑                                                             (기존)
3. [신규] 자동 기록 패스 — coupleId마다
   a. meta/recurringAutoRecords 읽기 → lastRecordedMonth
   b. autoRecord && expectedAmount > 0 인 카테고리마다 occurrencesInWindow(schedule, today, 7)
   c. 발생일마다 month = monthKey(occ):
        - lastRecordedMonth[categoryId] >= month  → skip
        - G1: entries where category==name && date in [월초,월말] limit 1 → 있으면 마커만 갱신, skip
        - entry 생성(create, 결정적 id) + 마커 갱신을 한 batch로 커밋
        - 발생일이 오늘이면 "기록 완료" 푸시 대상에 추가 (catch-up 분은 푸시 없음 — 하루 지난 알림은 소음)
4. 리마인더 패스 — 기존 로직. 단 autoRecord 카테고리는 대상에서 제외(D8)
5. 푸시 발송 — 기록 완료 알림은 커플 멤버 전원에게(설정 recurringTransaction.enabled === false면 skip, 기존과 동일)
```

생성 문서:

```ts
{
  id: 'recurrence-{categoryId}-{YYYY-MM}',
  coupleId,
  createdBy: payerUid,                 // D7 폴백 적용
  type: category.group,                // 'income' | 'expense'
  amount: Math.round(expectedAmount),
  category: category.name,
  description: '',
  date: Timestamp(seoulMidnightToUtc(occurrence)),
  createdAt: serverTimestamp,
  autoRecord: { categoryId, month },
}
```

### 푸시 메시지

| 종류                | 제목        | 본문                                              | click_action                                |
| ------------------- | ----------- | ------------------------------------------------- | ------------------------------------------- |
| 고정 지출 자동 기록 | 말랑 가계부 | {카테고리} {금액}원을 자동으로 기록했어요 ✅      | `/inner/cashbook/history?entryId={entryId}` |
| 고정 수입 자동 기록 | 말랑 가계부 | {카테고리} {금액}원이 들어온 것으로 기록했어요 ✅ | 동일                                        |

`data.kind = 'recurringAutoRecord'`, `data.entryId`, `data.categoryId`.

### 단위 테스트 (신규 — `functions/test/recurrence-core.test.mjs`, `node --test`)

> 이 프로젝트의 표준은 Playwright E2E이지만 스케줄 함수는 브라우저로 돌릴 수 없다.
> 순수 함수만 Node 내장 테스트 러너로 검증한다(추가 의존성 없음). `npm test` = `tsc` 빌드 후 `node --test test/`.

- `occurrencesInWindow`: 매월 25일, today=25일 → [25일]; today=27일 → [25일]; today=24일 → []; windowDays=7에서 8일 전 발생은 제외
- `dayOfMonth=31`, 2월 → 말일(28/29)
- `intervalMonths=2 + anchorMonth` 위상이 맞지 않는 달 → []
- `nthWeekday week=-1` 마지막 주 정확 계산
- 월 경계: today=11월 2일, 발생 10월 31일 → window 안이면 포함, `monthKey`는 '2026-10'
- `isLaterMonth('2026-11', '2026-10') === true`, 같은 달 false
- `autoRecordEntryId('cat1','2026-11') === 'recurrence-cat1-2026-11'`
- `seoulMidnightToUtc`: 2026-11-25 KST 00:00 → 2026-11-24T15:00:00Z

---

## UI 구성

### 1. `RecurringScheduleFields` — 자동 기록 섹션 추가

`enabled`일 때 「예상 금액」 아래에 노출:

```
┌ 발생일에 자동으로 기록 ──────────────── [토글] ┐
│ 매달 금액이 같은 항목에만 켜 주세요.            │
│ 발생일 아침에 내역이 생기고 알림으로 알려드려요.  │
│ (금액 없음) 예상 금액을 입력하면 켤 수 있어요.   │
│                                               │
│ ─ 토글 on 일 때 ─                              │
│ 기록자   [ 나 ] [ 짝꿍이름 ]                    │
│ 발생일이 이미 지났으면 다음 발생일부터 기록돼요.  │
└───────────────────────────────────────────────┘
```

- 토글 `data-testid="recurrence-auto-record-switch"`, `expectedAmount > 0`이 아니면 `disabled`.
- 기록자 칩 `data-testid="recurrence-payer-{uid}"`, `data-selected`. 멤버 목록은 `payerOptions: { uid; label }[]` prop.
  멤버가 1명(짝꿍 미연결)이면 칩을 숨기고 그 uid를 자동 선택.
- `autoRecord`가 켜지면 「미리 알림」 입력은 숨긴다(D8). 값은 보존.
- `expectedAmount`를 지워 0/빈 값이 되면 `autoRecord`를 자동으로 false로 되돌린다(이벤트 핸들러에서, useEffect 금지).

### 2. `CategoryForm` — 스키마·기본값·저장

- zod: `autoRecord: z.boolean().optional()`, `payerUid: z.string().nullable().optional()`.
  superRefine: `enabled && autoRecord`인데 `expectedAmount`가 양수가 아니면 `autoRecord` 에러("예상 금액을 입력해주세요"),
  `payerUid`가 없으면 에러("기록자를 선택해주세요").
- 새 props: `payerOptions`, `defaultPayerUid`(현재 사용자). 토글을 켤 때 `payerUid`가 비어 있으면 `defaultPayerUid`로 채운다.
- `buildRecurrencePayload`: `autoRecord`가 true면 `autoRecord: true, payerUid` 저장. false면 두 필드 모두 생략(하위호환, Firestore undefined 거부 회피).

### 3. `RecurringBadge` — 자동 기록 표시

`schedule.autoRecord`이면 기존 라벨 뒤에 `· 자동 기록`(`data-testid="category-auto-record-mark"`).

### 4. `EntryCard` — 자동 기록 배지

`entry.autoRecord`가 있으면 카테고리 이름 옆에 작은 `Badge variant="secondary"` "자동"(`data-testid="entry-auto-record-badge"`).

### 5. 내역 페이지 — `entryId` 딥링크

`/inner/cashbook/history?entryId=…` 로 진입하면 해당 내역을 **1회** 조회해 편집 시트(`handleEntryClick`)를 연다.
현재 조회 범위에 없을 수 있으므로(지난달 catch-up) `getEntry(coupleId, entryId)` 서비스로 문서를 직접 읽는다.
없으면 토스트 "내역을 찾을 수 없어요". 처리 후 쿼리는 `replaceState`로 제거(quickAdd와 같은 패턴).

### 6. 카테고리 페이지 — `payerOptions` 주입

`useCoupleMembers(coupleId)` → `{ uid, label: displayName || '짝꿍' }`(본인은 "나"), `defaultPayerUid = user.uid`.

---

## 분리해 둘 컴포넌트 (Storybook 단계)

기존 컴포넌트에 스토리를 추가한다(신규 컴포넌트 없음).

1. `RecurringScheduleFields` — `AutoRecordDisabledNoAmount`(금액 없어 토글 비활성), `AutoRecordOn`(기록자 칩 2명·미리 알림 숨김), `AutoRecordSingleMember`
2. `RecurringBadge` — `WithAutoRecord`
3. `EntryCard` — `AutoRecorded`

---

## E2E 테스트 시나리오 (`apps/web/e2e/specs/cashbook-recurring-auto-record.spec.ts`)

> 클라이언트에서 검증 가능한 범위. cron의 생성 로직은 Functions 단위 테스트로 분리(위).

1. 월세 편집 → 정기 발생 on, 예상 금액 비어 있음 → 자동 기록 토글이 **disabled**. 금액 800000 입력 → enabled.
2. 자동 기록 on → 기록자 칩 2개 노출, 「미리 알림」 입력이 사라짐. 짝꿍 선택 후 저장 → 재편집 시 토글 checked·짝꿍 칩 selected 복원.
3. 저장 후 카테고리 목록 배지에 "자동 기록" 표시.
4. 자동 기록 on 상태에서 예상 금액을 지우면 토글이 꺼지고 disabled로 돌아간다.
5. `autoRecord` 필드가 있는 내역을 시드 → 내역 페이지 카드에 "자동" 배지, 없는 내역엔 배지 없음.
6. `/inner/cashbook/history?entryId={시드 id}` 진입 → 편집 시트가 열리고 금액이 채워져 있다. 존재하지 않는 id → 토스트.

### 에뮬레이터 헬퍼 확장

- `seedCashbookCategory`의 `SeedRecurrence`에 `autoRecord?: boolean`, `payerUid?: string`
- `seedCashbookEntry`에 `autoRecord?: { categoryId; month }`, `id?: string`

---

## 구현 위치 요약

### 공유 (cashbook-core)

- `packages/cashbook-core/src/types.ts` — `RecurringSchedule.autoRecord/payerUid`, `CashbookEntry.autoRecord`

### 클라이언트 (web)

- `apps/web/src/components/cashbook/RecurringScheduleFields.tsx` (+ 스토리) — 자동 기록 섹션
- `apps/web/src/components/cashbook/CategoryForm.tsx` — 스키마·기본값·props
- `apps/web/src/utils/recurrence-form.ts` — payload
- `apps/web/src/components/cashbook/RecurringBadge.tsx` (+ 스토리)
- `apps/web/src/components/cashbook/EntryCard.tsx` (+ 스토리)
- `apps/web/src/services/cashbook.ts` — `getEntry`
- `apps/web/src/app/inner/cashbook/(main)/history/page.tsx` — `entryId` 딥링크
- `apps/web/src/app/inner/cashbook/(standalone)/categories/page.tsx` — `payerOptions` 주입

### Cloud Functions

- `functions/src/notifications/recurrence-core.ts` (신규) — 순수 날짜·id 함수
- `functions/src/notifications/recurringReminder.ts` — 자동 기록 패스 + 리마인더 제외
- `functions/test/recurrence-core.test.mjs` (신규), `functions/package.json` `test` 스크립트
- `firebase.json` functions.ignore에 `test` 추가

### 문서

- `docs/03-domain-models.md` — `CashbookEntry.autoRecord`, `RecurringSchedule.autoRecord/payerUid`
- `docs/pages/inner/cashbook-recurring-alerts.md` — 후속 「알림에서 퀵 입력」 → 이 문서로 대체 표기

---

## 배포 체크리스트

- [ ] PR 머지 후 `cd functions && npm test` 통과 확인
- [ ] `firebase deploy --only functions --project uandi-55ee4` (CI 없음 — 수동 배포. 머지만으로 반영되지 않는다)
- [ ] 다음 날 09:00 KST 이후 Functions 로그에서 `recurringAutoRecord created` 확인
- [ ] 건의자(feedback `Mu73kW0768my0ApxB9HF`)에게 어드민에서 상태 `resolved` 처리

---

## 범위 밖 (후속)

- 금액이 매달 다른 항목의 자동 기록(발생일에 금액만 묻는 알림)
- 발생일 당일이 아닌 시각 선택(현재 cron 시각 09:00 KST 고정)
- 자동 기록 일괄 되돌리기(지금은 내역을 개별 삭제)
