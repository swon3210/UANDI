# 도메인 모델 & Firestore 스키마

## 개요

모든 데이터는 **커플(couple)** 단위로 격리됩니다.
`coupleId`가 모든 컬렉션의 최상위 키입니다.

---

## Firestore 컬렉션 구조

```
users/{userId}
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
};
```

> **커버 이미지**: 별도 필드 없음. 해당 폴더의 가장 최근 사진(`takenAt DESC` 첫 번째)을 자동으로 커버로 사용.

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

## 카테고리 프리셋

가계부 항목 생성 시 제공하는 기본 카테고리입니다. 사용자는 직접 입력도 가능합니다.

```ts
const EXPENSE_CATEGORIES = [
  '식비',
  '교통',
  '쇼핑',
  '의료',
  '문화/여가',
  '주거/관리비',
  '통신',
  '보험',
  '저축',
  '기타',
] as const;

const INCOME_CATEGORIES = ['월급', '용돈', '부수입', '기타'] as const;
```

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
| cashbookEntries | `coupleId ASC`, `date DESC`            | 가계부 최신순      |
| cashbookEntries | `coupleId ASC`, `date ASC` (월 필터용) | 월별 조회          |
