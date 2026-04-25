# 페이지 명세: 가계부 알림 (예산 초과 경고)

## 목적

사용자가 가계부에 거래를 추가할 때 카테고리별/월별 예산 임계값에 도달하면 즉시 알림을 받게 한다. 커플 앱 특성상 **상대방의 거래로 인한 초과**도 빠르게 인지할 수 있어야 한다.

본 문서는 알림 시스템 전반의 첫 사이클로 **예산 초과 경고**만을 다룬다. 정기지출/수입 체크 팝업, 주간 마감 요약, 이상 거래 감지 등은 후속 사이클로 분리한다.

---

## 사용자 스토리

- 커플로서, 카테고리 예산의 80%에 도달하면 즉시 알림을 받아 남은 한 달 지출을 조절하고 싶다.
- 커플로서, 월 전체 지출 예산을 초과하면 빨간 경고를 보고 싶다.
- 커플로서, 파트너가 큰 지출을 추가해 예산을 초과시켰을 때 내 화면에서도 즉시 알 수 있어야 한다.
- 커플로서, 한 번 본 경고는 dismiss할 수 있되 다음 임계값(예: 100% → 120%) 진입 시 다시 보고 싶다.
- 커플로서, 알림이 부담스러우면 설정에서 끌 수 있어야 한다.

---

## 임계값 단계화

| 비율 (`actual / budget`) | 단계 | 색상 토큰 | 이모지 | 의미 |
|--------------------------|------|----------|--------|------|
| `< 80%` | safe | `--income` | 🟢 | 안정 — 알림 없음 |
| `≥ 80% & < 100%` | warn80 | `--warning` | 🟡 | 주의 — 예산 소진 임박 |
| `≥ 100% & < 120%` | over100 | `--expense` | 🔴 | 초과 — 예산을 넘음 |
| `≥ 120%` | over120 | `--expense` (강조) | 🚨 | 위험 — 예산을 크게 초과 |

> 기존 월간 대시보드(`04c-cashbook-monthly.md`)의 안정/경고/긴급 색상 체계와 일치시키되, 알림용으로 120% 단계를 추가한다.

### 체크 대상

알림은 두 레벨에서 독립적으로 평가한다:

1. **카테고리별 예산** — `MonthlyBudgetItem`의 각 카테고리별 `budgetAmount` 대비 해당 카테고리 누적 지출
2. **월 전체 지출 예산** — 전 카테고리 `budgetAmount` 합계 대비 전체 지출 합계 (`MonthlyOverview.expenseBudget` vs `expenseActual`)

수입/투자/유연 항목은 알림 대상이 아니다 (지출만).

### 새 임계값 진입(transition)이란?

- 거래 직전 임계값이 `safe`였다가 거래 후 `warn80` 이상이 되면 → 새 진입
- `warn80` → `over100` → 새 진입
- `over100` → `over120` → 새 진입
- 같은 단계 내 추가 지출 → **새 진입 아님** (알림 X)
- 단계가 낮아지는 경우(거래 삭제로 인한) → **알림 X**

---

## UI 구성

### 1. 거래 추가 직후 Sonner 토스트 (일회성, 본인 한정)

거래 추가 mutation의 `onSuccess`에서 새 임계값 진입 여부를 판단하고, 진입한 항목에 대해서만 토스트를 띄운다.

| 단계 | 토스트 메시지 예 | 아이콘 |
|------|------------------|--------|
| warn80 (카테고리) | `이번 달 식비가 예산의 80%를 넘었어요` | 🟡 |
| over100 (카테고리) | `이번 달 식비가 예산을 넘었어요` | 🔴 |
| over120 (카테고리) | `식비가 예산보다 20% 이상 초과됐어요` | 🚨 |
| warn80 (월 전체) | `이번 달 전체 지출이 예산의 80%를 넘었어요` | 🟡 |
| over100 (월 전체) | `이번 달 전체 지출이 예산을 넘었어요` | 🔴 |
| over120 (월 전체) | `이번 달 전체 지출이 예산보다 20% 이상 초과됐어요` | 🚨 |

토스트는 본인 액션 한정 — 파트너의 거래 추가로 인해서는 토스트가 뜨지 않는다 (지속 노출 배너로 처리).

### 2. 가계부 페이지 상단 배너 (지속 노출, 양쪽 모두 표시)

가계부 메인 / 월간 / 주간 페이지 모두 상단에 활성 경고 배너를 마운트한다.

마운트 위치: `apps/web/src/app/cashbook/(main)/history/layout.tsx` — 3개 페이지(`/cashbook/history`, `/cashbook/history/monthly`, `/cashbook/history/weekly`) 공통 레이아웃이므로 한 곳에서 처리.

```
┌──────────────────────────────┐
│  🚨 이번 달 식비가 예산보다 20%   │
│  이상 초과됐어요              [×]│
├──────────────────────────────┤
│  🔴 사회생활(나) 예산을 넘었어요  [×]│
├──────────────────────────────┤
│  🟡 전체 지출이 예산의 80%를      │
│  넘었어요                  [×]│
└──────────────────────────────┘
```

규칙:
- 현재 활성 경고(임계값 진입 + dismiss 안 됨)만 표시
- 활성 경고가 없으면 컴포넌트 자체 렌더링 X (`null`)
- 카테고리별로 한 줄, 월 전체는 별도 라인
- 가장 높은 임계값(over120 → over100 → warn80) 순으로 정렬
- dismiss(×) 클릭 시 해당 항목만 사라짐
- 페이지 진입/리프레시 시 dismiss 상태 유지(localStorage)

### 3. 알림 설정 UI

기존 `NotificationSettingsForm`(이미 구현됨)을 활용한다.

- 경로: `/cashbook/history/weekly/notifications`
- `budgetWarning.enabled = false`이면 토스트와 배너 모두 표시하지 않음
- 푸시 알림도 발송하지 않음

---

## dismiss 정책

`useLocalStorage`로 dismiss 상태를 관리한다.

```ts
key: `budget-alert-dismissed::{coupleId}::{yyyy-mm}::{categoryIdOrTotal}::{threshold}`
value: boolean
```

- `categoryIdOrTotal`: 카테고리 알림은 `categoryId`, 월 전체 알림은 `total`
- `threshold`: `'warn80' | 'over100' | 'over120'`

**자동 재노출 케이스**:
- `over100`을 dismiss했더라도 거래가 추가되어 `over120` 단계 진입 시 → key가 다르므로 자동으로 다시 보임
- 다음 달이 되면 `yyyy-mm` 부분이 달라져 모든 dismiss 상태 자연 리셋

**dismiss되지 않는 케이스**:
- 토스트는 항상 일회성이므로 dismiss 개념 없음 (Sonner 자체 자동 닫힘)

---

## 커플 실시간 동기화

- `useCashbookEntries`가 Firestore `onSnapshot` 실시간 구독으로 동작해야 함 (현재 미확인 — 확인 후 필요 시 변경)
- 파트너가 거래 추가 시:
  - 본인 화면의 배너에 새 활성 경고가 자동 추가됨
  - 본인 화면에 토스트는 뜨지 않음 (본인 액션이 아니므로)
  - 푸시 알림은 받음 (앱이 백그라운드/닫혀있을 수 있으므로)

---

## 푸시 알림 (FCM)

### 발송 조건

`couples/{coupleId}/cashbookEntries` 문서가 생성될 때 Cloud Functions가 트리거되어 평가한다.

- 새 임계값 진입(transition)이 있을 때만 발송
- 거래 작성자(`createdBy`) 본인은 토스트로 처리하므로 **파트너에게만 푸시 발송**
- 파트너의 `NotificationSettings.budgetWarning.enabled === true`인 경우에만 발송

### 푸시 메시지 형식

| 단계 | 푸시 제목 | 푸시 본문 |
|------|----------|----------|
| warn80 (카테고리) | UANDI 가계부 | 이번 달 {카테고리}가 예산의 80%를 넘었어요 🟡 |
| over100 (카테고리) | UANDI 가계부 | 이번 달 {카테고리}가 예산을 넘었어요 🔴 |
| over120 (카테고리) | UANDI 가계부 | {카테고리}가 예산보다 20% 이상 초과됐어요 🚨 |
| warn80 (월 전체) | UANDI 가계부 | 이번 달 전체 지출이 예산의 80%를 넘었어요 🟡 |
| over100 (월 전체) | UANDI 가계부 | 이번 달 전체 지출이 예산을 넘었어요 🔴 |
| over120 (월 전체) | UANDI 가계부 | 이번 달 전체 지출이 예산보다 20% 이상 초과됐어요 🚨 |

### 푸시 클릭 시 동작

- 월간 가계부 페이지(`/cashbook/history/monthly`)로 이동

---

## 데이터 모델

### NotificationSettings (기존, 변경 없음)

`apps/web/src/types/index.ts:119-131`에 이미 정의됨.

```ts
type NotificationSettings = {
  coupleId: string;
  userId: string;
  recordReminder: { enabled: boolean; time: string; days: number[] };
  budgetWarning: { enabled: boolean };
  updatedAt: Timestamp;
};
```

**Firestore 경로**: `users/{userId}/settings/notifications`

### FcmToken (신규)

```ts
type FcmToken = {
  id: string;          // 토큰 자체를 id로 사용 (해시)
  userId: string;
  token: string;       // FCM registration token
  userAgent: string;   // 디바이스 식별용
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
};
```

**Firestore 경로**: `users/{userId}/fcmTokens/{tokenId}`

> 한 유저가 여러 디바이스/브라우저에서 사용할 수 있으므로 다중 토큰 저장.
> 만료/실패한 토큰은 Cloud Functions에서 자동 정리.

---

## 구현 위치

### 클라이언트
- `apps/web/src/components/cashbook/BudgetAlertBanner.tsx` (신규)
- `apps/web/src/hooks/useBudgetAlerts.ts` (신규) — 임계값 계산, dismiss 상태, 토스트 트리거
- `apps/web/src/hooks/useFcmToken.ts` (신규)
- `apps/web/src/hooks/useMonthlyBudget.ts` — `getBudgetThreshold` 함수 추가
- `apps/web/src/hooks/useCashbook.ts` — `useAddEntry` `onSuccess`에서 토스트 트리거
- `apps/web/src/app/cashbook/(main)/history/layout.tsx` — 3페이지 공통 레이아웃에 배너 마운트
- `apps/web/public/firebase-messaging-sw.js` (신규)

### Cloud Functions
- `functions/src/notifications/budgetAlert.ts` (신규)
- `couples/{coupleId}/cashbookEntries/{entryId}` `onCreate` 트리거

---

## 관련 문서

- 월간 대시보드: `04c-cashbook-monthly.md` (예산 색상 체계의 원본)
- 주간 대시보드: `04d-cashbook-weekly.md` (기록 알림 — 별도 사이클)
- 카테고리 체계: `04a-cashbook-categories.md`
- 연간 예산 계획: `04b-cashbook-annual-plan.md`

---

## 후속 사이클 (이번 작업 제외)

- **정기거래 체크 팝업**: 정기지출 데이터 모델 신규 정의 후 별도 명세
- **주간 마감 요약 알림**: 일요일 저녁 push, `04d` 명세 확장
- **이상 거래 감지**: 평소 평균 대비 큰 지출 입력 시 확인 모달
- **장기 미입력 리마인더**: 3일 이상 거래 없으면 푸시
