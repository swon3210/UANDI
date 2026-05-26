# 도메인 모델 & Firestore 스키마

## 개요

모든 데이터는 **커플(couple)** 단위로 격리됩니다.
`coupleId`가 모든 컬렉션의 최상위 키입니다.

---

## Firestore 컬렉션 구조

```
users/{userId}
  └── fcmTokens/{tokenId}
couples/{coupleId}
  └── folders/{folderId}
  └── photos/{photoId}
  └── cashbookEntries/{entryId}
```

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

> FCM 푸시 토큰은 **`users/{uid}/fcmTokens/{tokenId}` sub-collection**으로 별도 저장한다. 디바이스별 토큰을 다중으로 보관하기 위해서이며, 토큰 자체의 SHA-256 해시를 `tokenId`로 사용한다. 스키마는 `docs/pages/04e-cashbook-notifications.md`의 `FcmToken` 타입 참조.

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

> 상세 UX와 프리셋 목록은 `pages/04a-cashbook-categories.md` 참고.

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

## Firestore 보안 규칙 명세

> 실제 rules 파일 작성 시 이 명세를 기반으로 합니다.

| 컬렉션                                 | 읽기                     | 쓰기                     |
| -------------------------------------- | ------------------------ | ------------------------ |
| `users/{uid}`                          | 본인만                   | 본인만                   |
| `couples/{coupleId}`                   | memberUids에 포함된 유저 | memberUids에 포함된 유저 |
| `couples/{coupleId}/folders/*`         | 같은 커플 멤버           | 같은 커플 멤버           |
| `couples/{coupleId}/photos/*`          | 같은 커플 멤버           | 같은 커플 멤버           |
| `couples/{coupleId}/cashbookEntries/*` | 같은 커플 멤버           | 같은 커플 멤버           |

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
