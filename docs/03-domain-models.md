# 도메인 모델 & Firestore 스키마

## 개요

모든 데이터는 **커플(couple)** 단위로 격리됩니다.
`coupleId`가 모든 컬렉션의 최상위 키입니다.

UANDI는 두 공간 구조(`docs/08-spaces.md`)를 따릅니다:

- **우리집** 영역(가계부·갤러리): `couples/{coupleId}/<영역>` — 커플 공동 소유
- **재테크** 영역(환테크·투자·적금): `couples/{coupleId}/sideHustles/{uid}/<영역>` — 본인만 접근, 합산은 `couples/{coupleId}/meta/outerSummary` 경유

`sideHustles/{uid}` 격리는 저장 위치가 아니라 **Firestore 보안 규칙**으로 강제합니다.

---

## Firestore 컬렉션 구조

```
users/{userId}
couples/{coupleId}
  ├── folders/{folderId}                  (우리집 — 갤러리)
  ├── photos/{photoId}                    (우리집 — 갤러리)
  ├── cashbookEntries/{entryId}           (우리집 — 가계부)
  ├── cashbookCategories/{categoryId}     (우리집 — 가계부)
  ├── meta/outerSummary                   (재테크 — 커플 합산 요약, v1.1)
  └── sideHustles/{uid}/                  (재테크 — 본인만 접근)
      ├── forexTrades/{tradeId}           (v1.1)
      ├── forexHoldings/{currency}        (v1.1)
      ├── positions/{positionId}          (v1.1)
      └── savings/{accountId}             (v1.1)
```

> **v1 시점**: 환테크 화면은 차트·전망 표시만 하므로 실제 재테크 컬렉션은 도입되지 않습니다. `meta/outerSummary`와 `sideHustles/*` 컬렉션은 v1.1에서 본격 사용되며, 보안 규칙만 v1에 선제 적용해 둡니다.

---

## TypeScript 타입 정의

> `src/types/index.ts`에 아래 타입을 그대로 정의합니다.

### User

```ts
type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  coupleId: string | null; // 커플 연결 전 null
  createdAt: Timestamp;
};
```

**Firestore 경로**: `users/{uid}`

---

### Couple

```ts
type Couple = {
  id: string;
  memberUids: string[]; // 생성 시 1명, 커플 연결 완료 후 2명
  inviteCode: string; // 6자리 대문자 영숫자, 유니크
  inviteCodeExpiresAt: Timestamp; // 생성 후 48시간
  createdAt: Timestamp;
};
```

> **memberUids 상태 변화**: `createCouple()` 직후에는 `[uid]` (1명), 상대방이 합류하면 `[uid1, uid2]` (2명)이 됩니다. 커플 연결 완료 여부는 `memberUids.length === 2`로 판단합니다.

**Firestore 경로**: `couples/{coupleId}`

---

### Folder (사진 폴더)

```ts
type Folder = {
  id: string;
  coupleId: string;
  name: string; // 폴더 이름
  createdBy: string; // userId
  createdAt: Timestamp;
  parentFolderId: string | null; // 부모 폴더 id. 루트면 null
  depth: number; // 루트 = 0, 하위로 내려갈수록 +1, 최대 4 (총 5단계)
  path: string[]; // 루트부터 부모까지의 id 배열. 자기 자신 id는 미포함. 루트면 []
};
```

> **커버 이미지**: 별도 필드 없음. 해당 폴더의 가장 최근 사진(`takenAt DESC` 첫 번째)을 자동으로 커버로 사용.

> **중첩 규칙**: 폴더는 다른 폴더의 하위로 만들 수 있다. 최대 5단계(`depth 0~4`)까지 허용.
> - 생성 시 `depth = parent.depth + 1`, `path = [...parent.path, parent.id]` 로 계산.
> - `path`는 `array-contains`로 "특정 폴더 및 그 하위 전체"를 한 번에 조회하기 위한 캐시.
> - 삭제는 재귀 삭제(하위 폴더/사진 모두 함께 제거).

**Firestore 경로**: `couples/{coupleId}/folders/{folderId}`

---

### Photo

```ts
type Photo = {
  id: string;
  coupleId: string;
  uploadedBy: string; // userId
  folderId: string; // 반드시 하나의 폴더에 속함
  tags: string[]; // 자유 입력 태그 (빈 배열 허용)
  storageUrl: string; // Firebase Storage 원본 URL
  thumbnailUrl: string | null; // 썸네일 (없으면 원본 사용)
  caption: string; // 빈 문자열 허용
  takenAt: Timestamp; // 사진 촬영일 (사용자 입력 또는 EXIF)
  uploadedAt: Timestamp; // 서버 업로드 시각
  width: number; // 원본 픽셀 너비
  height: number; // 원본 픽셀 높이
};
```

**Firestore 경로**: `couples/{coupleId}/photos/{photoId}`

**Storage 경로**: `couples/{coupleId}/photos/{photoId}/original.{ext}`

---

### CashbookEntry (가계부 항목)

```ts
type CashbookEntry = {
  id: string;
  coupleId: string;
  createdBy: string; // userId
  type: 'income' | 'expense';
  amount: number; // 원화 정수 (소수점 없음)
  category: string; // 카테고리 레이블 (자유 입력 or 프리셋)
  description: string; // 메모 (빈 문자열 허용)
  date: Timestamp; // 거래 발생일 (사용자가 지정)
  createdAt: Timestamp; // 서버 생성 시각
};
```

**Firestore 경로**: `couples/{coupleId}/cashbookEntries/{entryId}`

---

## CashbookCategory (가계부 카테고리)

> 상세 UX와 프리셋 목록은 `pages/inner/cashbook-categories.md` 참고.

```ts
type CategoryGroup = 'income' | 'expense' | 'flex';

type CategorySubGroup =
  | 'regular_income'
  | 'irregular_income'
  | 'fixed_expense'
  | 'variable_common'
  | 'variable_personal'
  | 'joint_flex'
  | 'personal_flex';

type CashbookCategory = {
  id: string;
  coupleId: string;
  group: CategoryGroup;
  subGroup: CategorySubGroup;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;

  /** 부모 카테고리 id. null이면 본인이 부모(레벨 1). 값이 있으면 자식(레벨 2). */
  parentCategoryId: string | null;

  /** 카테고리 용도 설명. 입력 시 hint로 노출. 빈 문자열 허용. */
  description: string;

  /** 이 카테고리에 해당하는 항목 예시. 입력 시 자동완성 후보 + 시각적 가이드. */
  examples: string[];

  createdAt: Timestamp;
};
```

**Firestore 경로**: `couples/{coupleId}/cashbookCategories/{categoryId}`

### 계층 규칙

- 카테고리 계층은 **부모-자식 2단계까지만** 허용한다. 자식의 자식(레벨 3 이상)은 만들 수 없다.
- 자식 카테고리는 부모의 `group`/`subGroup`을 상속한다. 자식 생성/수정 시 부모와 다른 그룹은 선택 불가.
- 부모 삭제 시 자식도 함께 삭제한다 (재귀 삭제). 진행 전 사용 중인 거래 건수를 확인하는 다이얼로그를 띄운다.
- `parentCategoryId`가 null인 카테고리만 또 다른 자식의 부모가 될 수 있다. (자식을 다시 부모로 만들 수 없음 — 모델 무결성 보호)

### 거래(`CashbookEntry`)의 카테고리 참조

- **결정 (2026-05)**: 거래는 계속 `CashbookEntry.category: string`(이름 기반)을 유지한다. `categoryId` 마이그레이션은 도입하지 않는다.
- 자식 카테고리도 자기 자신의 `name`으로 저장된다.
- 같은 부모 아래 자식 카테고리 `name`은 부모 내에서 **유니크**해야 한다. 단, 부모끼리 또는 다른 부모의 자식과는 이름이 같을 수 있다 (현재도 '식비'가 공통/개인에 중복 존재).
- 통계·예산은 자식 → 부모 롤업으로 합산한다. 자식이 있는 부모를 직접 선택한 거래는 부모 자체 합계로만 계산된다 ("미분류" 처리).
- 자식 카테고리를 삭제해도 해당 자식 이름을 사용하던 기존 거래는 그대로 유지된다 (orphaned 허용).

### 마이그레이션

1. 기존 카테고리 문서에 `parentCategoryId: null`, `description: ''`, `examples: []` 필드를 백필한다.
2. `DEFAULT_CATEGORIES` 프리셋에 권장 `description` / `examples`를 채워둔다 (커플 신규 가입자에 한해 자동 적용).
3. 기존 거래(`CashbookEntry.category`)는 변경 없음.
4. Firestore 보안 규칙은 추가 필드에 영향 없음. 신규 필드는 `string` / `string[]`만 허용하도록 검증 추가.

---

## 재테크 도메인 (v1.1)

> v1에서는 실제 컬렉션이 도입되지 않습니다. 아래 타입·경로는 v1.1 작업 시작 시점의 기준입니다.
> v1에서는 **보안 규칙만 선제 적용**하여 향후 데이터 도입 시 격리가 즉시 동작하도록 합니다.

### OuterSummary (커플 합산 요약)

재테크 원본 거래는 본인 외에는 접근할 수 없으므로, 커플 대시보드에서 두 사람의 진척을 함께 보기 위한 단일 요약 문서를 유지합니다.

```ts
type OuterSummary = {
  byUser: Record<string /* uid */, {
    forex?: {
      realizedPnlKrw: number;       // 누적 실현 환차익(원)
      unrealizedPnlKrw: number;     // 미실현 평가손익(원, 최신 환율 기준)
      updatedAt: Timestamp;
    };
    investment?: {
      totalValueKrw: number;        // 보유 종목 평가액 합계
      totalCostKrw: number;         // 매입 원가 합계
      updatedAt: Timestamp;
    };
    savings?: {
      totalPrincipalKrw: number;    // 적금 원금 합계
      monthlyContributionKrw: number; // 월 납입액 합계
      updatedAt: Timestamp;
    };
  }>;
  combined: {
    totalRealizedPnlKrw: number;    // 모든 멤버 환테크 실현 손익 합
    totalAssetKrw: number;          // forex+investment+savings 총 자산
    updatedAt: Timestamp;
  };
};
```

**Firestore 경로**: `couples/{coupleId}/meta/outerSummary` (단일 문서)

**갱신 규칙**: 원본(`sideHustles/{uid}/*`)이 변경될 때마다 해당 사용자의 `byUser[uid]` 영역과 `combined`를 다시 계산해 머지한다. 클라이언트는 자신의 `byUser[uid]`만 쓸 수 있고, `combined`는 서버 라우트에서만 갱신한다(파트너 값 덮어쓰기 방지).

---

### ForexTrade (외화 거래)

```ts
type ForexTrade = {
  id: string;
  coupleId: string;
  uid: string;                      // 소유자 (sideHustles/{uid} 경로와 동일)
  currency: 'USD' | 'JPY' | 'EUR' | 'CNY';
  side: 'buy' | 'sell';
  rate: number;                     // 체결 환율 (1단위당 KRW; JPY는 100엔당)
  amountForeign: number;            // 외화 수량
  amountKrw: number;                // 원화 환산 금액(수수료 포함)
  feeKrw: number;                   // 거래 수수료(원)
  memo: string;
  executedAt: Timestamp;            // 실제 체결 시점
  createdAt: Timestamp;             // 서버 기록 시점
};
```

**Firestore 경로**: `couples/{coupleId}/sideHustles/{uid}/forexTrades/{tradeId}`

---

### ForexHolding (외화 보유 현황)

```ts
type ForexHolding = {
  currency: 'USD' | 'JPY' | 'EUR' | 'CNY';
  coupleId: string;
  uid: string;
  amountForeign: number;            // 현재 잔량 (외화)
  averageRateKrw: number;           // 평균 매수 환율 (이동평균)
  realizedPnlKrw: number;           // 누적 실현 손익(매도 시 적립)
  updatedAt: Timestamp;
};
```

**Firestore 경로**: `couples/{coupleId}/sideHustles/{uid}/forexHoldings/{currency}` (통화별 단일 문서)

> 거래(`ForexTrade`) 생성 시 동일 트랜잭션에서 평균단가법으로 holding을 갱신하고, 그 결과를 `meta/outerSummary.byUser[uid].forex`에 반영한다.

---

### Position (투자 포지션)

```ts
type Position = {
  id: string;
  coupleId: string;
  uid: string;
  symbol: string;                   // 종목 코드 (예: '005930', 'AAPL')
  market: 'KOSPI' | 'KOSDAQ' | 'NASDAQ' | 'NYSE' | 'OTHER';
  name: string;                     // 사용자 표기명 (자유 입력)
  quantity: number;                 // 보유 수량 (소수 허용 — 해외 주식 분수 매수)
  averageCostKrw: number;           // 평균 매입 단가(원)
  currentValueKrw: number | null;   // 현재 평가액(시세 갱신 시; v1.1 초기는 수동 입력 허용)
  currency: 'KRW' | 'USD';          // 매입 통화
  openedAt: Timestamp;
  updatedAt: Timestamp;
};
```

**Firestore 경로**: `couples/{coupleId}/sideHustles/{uid}/positions/{positionId}`

> v1.1 초기에는 시세 자동 갱신을 다루지 않는다. 평가액은 사용자가 직접 입력하거나 비워 둔다.

---

### SavingsAccount (적금 계좌)

```ts
type SavingsAccount = {
  id: string;
  coupleId: string;
  uid: string;
  name: string;                     // 계좌 별칭 (예: "신한 정기적금")
  bank: string;
  principalKrw: number;             // 현재 원금(원)
  monthlyContributionKrw: number;   // 월 납입액
  interestRate: number;             // 연이율 (소수, 예: 0.035 = 3.5%)
  startedAt: Timestamp;
  maturesAt: Timestamp;             // 만기일
  updatedAt: Timestamp;
};
```

**Firestore 경로**: `couples/{coupleId}/sideHustles/{uid}/savings/{accountId}`

---

## Firestore 보안 규칙 명세

> 실제 rules 파일 작성 시 이 명세를 기반으로 합니다.

| 컬렉션                                                    | 읽기                                       | 쓰기                                       |
| --------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| `users/{uid}`                                             | 본인만                                     | 본인만                                     |
| `couples/{coupleId}`                                      | memberUids에 포함된 유저                   | memberUids에 포함된 유저                   |
| `couples/{coupleId}/folders/*`                            | 같은 커플 멤버                             | 같은 커플 멤버                             |
| `couples/{coupleId}/photos/*`                             | 같은 커플 멤버                             | 같은 커플 멤버                             |
| `couples/{coupleId}/cashbookEntries/*`                    | 같은 커플 멤버                             | 같은 커플 멤버                             |
| `couples/{coupleId}/cashbookCategories/*`                 | 같은 커플 멤버                             | 같은 커플 멤버                             |
| `couples/{coupleId}/meta/outerSummary`                    | 같은 커플 멤버                             | 본인의 `byUser[uid]` 영역만 변경 가능 (`combined`는 서버 라우트에서만 갱신) |
| `couples/{coupleId}/sideHustles/{uid}/**`                 | `uid == request.auth.uid` (본인만)         | `uid == request.auth.uid` (본인만)         |

---

## 인덱스 요구사항

| 컬렉션          | 인덱스 필드                            | 용도               |
| --------------- | -------------------------------------- | ------------------ |
| photos          | `coupleId ASC`, `takenAt DESC`         | 갤러리 시간순 정렬 |
| photos          | `coupleId ASC`, `folderId ASC`, `takenAt DESC` | 폴더별 사진 조회 |
| photos          | `coupleId ASC`, `tags ARRAY_CONTAINS`, `takenAt DESC` | 태그별 사진 조회 |
| folders         | `parentFolderId ASC`, `createdAt DESC` | 부모 폴더별 하위 폴더 조회 |
| folders         | `path ARRAY_CONTAINS`                  | 특정 폴더의 하위 전체 조회 (재귀 삭제) |
| cashbookEntries | `coupleId ASC`, `date DESC`            | 가계부 최신순      |
| cashbookEntries | `coupleId ASC`, `date ASC` (월 필터용) | 월별 조회          |
| forexTrades (v1.1) | `executedAt DESC`                   | 본인 거래 최신순 (sideHustles 하위라 coupleId·uid는 경로로 결정됨) |
| positions (v1.1)   | `updatedAt DESC`                    | 본인 포지션 최신순 |
| savings (v1.1)     | `maturesAt ASC`                     | 만기일 빠른 순     |
