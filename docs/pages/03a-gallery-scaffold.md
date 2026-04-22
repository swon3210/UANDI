# 사진 갤러리 1단계: 타입 정의 + 폴더 CRUD + 갤러리 메인

> 상위 명세: `03-photo-gallery.md`

## 범위

- `Folder`, `Photo` TypeScript 타입 정의
- 폴더 생성/이름변경/삭제
- 갤러리 메인 페이지 (`/photos`) — 전체/폴더/태그 3개 탭
- 폴더 상세 페이지 (`/photos/folder/[folderId]`) — 기본 그리드만 (필터·선택 모드는 3단계)
- 태그 상세 페이지 (`/photos/tag/[tagName]`) — 기본 그리드만

---

## UI 구성

### 갤러리 메인 (/photos)

상단 탭으로 **전체 / 폴더 / 태그** 뷰를 전환한다.

```
┌─────────────────────────┐
│  ← 사진              [+] │  ← Header + 업로드 버튼 (2단계에서 구현, 이 단계에서는 disabled)
├─────────────────────────┤
│  [ 전체 | 폴더 | 태그 ]  │  ← Tabs
├─────────────────────────┤
│                           │
│  (탭별 콘텐츠)            │
│                           │
├─────────────────────────┤
│  [홈] [사진] [가계부]     │
└─────────────────────────┘
```

#### 전체 탭

모든 사진을 시간순(최신 먼저) 2열 그리드로 표시.

```
┌─────┐ ┌─────┐
│     │ │     │   ← 2열 정사각형 썸네일 (아바타 뱃지는 3단계)
└─────┘ └─────┘
┌─────┐ ┌─────┐
│     │ │     │
└─────┘ └─────┘
...
```

- 무한 스크롤 (한 번에 20장)
- 사진 없을 때 `EmptyState`: 📷 "아직 사진이 없어요" + [첫 사진 올리기] 버튼
- 사진 클릭 → `/photos/[id]` (2단계에서 상세 페이지 구현)

#### 폴더 탭

폴더 목록을 카드 형태로 표시. 우상단에 [+ 새 폴더] 버튼.

```
┌─────────────────────────┐
│                    [+ 새 폴더] │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │  (커버 이미지)     │  │  ← 폴더의 최신 사진이 커버 (사진 없으면 플레이스홀더)
│  │                   │  │
│  │  제주도 여행       │  │  ← 폴더명 오버레이
│  │  12장              │  │  ← 사진 수
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  (커버 이미지)     │  │
│  │  우리집 일상       │  │
│  │  8장               │  │
│  └───────────────────┘  │
│  ...                     │
└─────────────────────────┘
```

- 폴더 카드 클릭 → `/photos/folder/[folderId]`로 이동
- 폴더가 없을 때 `EmptyState`: 📁 "폴더를 만들어 사진을 정리해보세요" + [새 폴더 만들기] 버튼

#### 태그 탭

커플의 모든 사진에서 사용된 태그를 `Badge` 형태로 나열. 각 태그 옆에 사진 수 표시.

```
┌─────────────────────────┐
│  #벚꽃 (5)  #카페 (12)   │
│  #바다 (8)  #기념일 (3)  │
│  #맛집 (15) #여행 (20)   │
│  ...                     │
└─────────────────────────┘
```

- 태그 클릭 → `/photos/tag/[tagName]`으로 이동
- 태그가 없을 때 `EmptyState`: 🏷️ "사진에 태그를 추가해보세요"

---

### 폴더 생성 — Bottom Sheet

폴더 탭의 [+ 새 폴더] 버튼 클릭 시.

```
┌─────────────────────────┐
│  새 폴더                 │
│                         │
│  폴더 이름               │
│  ┌───────────────────┐  │
│  │                   │  │  ← Input, placeholder: "예: 제주도 여행"
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  만들기            │  │  ← primary, 이름 입력 시 활성화
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

---

### 폴더 상세 (/photos/folder/[folderId]) — 기본 모드

```
┌─────────────────────────┐
│  ← 제주도 여행      [⋮] │  ← Header: 폴더명 + 더보기 (이름변경/삭제)
├─────────────────────────┤
│                           │
│  ┌─────┐ ┌─────┐        │
│  │     │ │     │        │  ← 2열 그리드 (아바타 뱃지·필터·선택 모드는 3단계)
│  └─────┘ └─────┘        │
│  ...                     │
│                           │
└─────────────────────────┘
```

- 더보기 메뉴 [⋮]:
  - **이름 변경**: Bottom Sheet로 폴더명 수정
  - **폴더 삭제**: 사진이 있으면 삭제 불가 → "사진을 먼저 다른 폴더로 이동해주세요" 안내
- 무한 스크롤

---

### 태그 상세 (/photos/tag/[tagName]) — 기본 모드

```
┌─────────────────────────┐
│  ← #벚꽃                │
├─────────────────────────┤
│                           │
│  ┌─────┐ ┌─────┐        │
│  │     │ │     │        │  ← 2열 그리드 (아바타 뱃지·필터는 3단계)
│  └─────┘ └─────┘        │
│  ...                     │
│                           │
└─────────────────────────┘
```

- 다른 폴더에 속한 사진도 태그가 같으면 함께 표시
- 무한 스크롤

---

## 기술 명세

### 타입 정의

`src/types/index.ts`에 추가:

```ts
type Folder = {
  id: string;
  coupleId: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  parentFolderId: string | null; // 루트 폴더면 null
  depth: number; // 0~4
  path: string[]; // 루트→부모까지의 id 배열
};

type Photo = {
  id: string;
  coupleId: string;
  uploadedBy: string;
  folderId: string;
  tags: string[];
  storageUrl: string;
  thumbnailUrl: string | null;
  caption: string;
  takenAt: Timestamp;
  uploadedAt: Timestamp;
  width: number;
  height: number;
};
```

### 갤러리 데이터 페칭

```ts
// 전체 사진 — 무한 스크롤 (TanStack Query + useInfiniteQuery)
query(
  collection(db, `couples/${coupleId}/photos`),
  orderBy('takenAt', 'desc'),
  startAfter(lastDoc),
  limit(20)
);

// 폴더별 사진
query(
  collection(db, `couples/${coupleId}/photos`),
  where('folderId', '==', folderId),
  orderBy('takenAt', 'desc'),
  startAfter(lastDoc),
  limit(20)
);

// 태그별 사진
query(
  collection(db, `couples/${coupleId}/photos`),
  where('tags', 'array-contains', tagName),
  orderBy('takenAt', 'desc'),
  startAfter(lastDoc),
  limit(20)
);
```

- 한 번에 20장 로드
- 스크롤 하단 도달 시 다음 페이지 자동 로드
- 이미지 로딩 중 Skeleton 표시

### 태그 집계

```ts
// 커플의 모든 사진에서 사용된 태그 목록 조회
// 클라이언트 캐싱: TanStack Query로 태그 목록 캐시
// 사진 업로드/편집 시 invalidate
```

> 태그 목록은 별도 컬렉션 없이 사진의 `tags` 배열에서 클라이언트 사이드로 집계한다.

### 폴더 관리

- 생성: 폴더 탭 [+ 새 폴더] 버튼 → Bottom Sheet (루트 생성)
- 하위 폴더 생성: 폴더 상세 페이지 상단 하위 폴더 섹션의 [+ 새 하위 폴더] 버튼
  - `parentFolderId`는 현재 폴더 id, `depth`는 `parent.depth + 1`, `path`는 `[...parent.path, parent.id]`로 계산
  - `depth > 4`가 되면 생성 불가 → 버튼 비활성화 + 툴팁 "최대 5단계까지만 만들 수 있어요"
- 삭제: 폴더 상세 페이지 헤더에서 [⋮] → "폴더 삭제"
  - 확인 Sheet에 "이 폴더와 하위 폴더 N개, 사진 M장을 모두 삭제할까요?" 문구
  - 확인 시 **재귀 삭제**: 하위 폴더 전체 + 해당 사진 Firestore 문서 + Storage 파일까지 제거
- 이름 수정: 폴더 상세 페이지 헤더에서 [⋮] → "이름 변경" → Bottom Sheet

### 폴더 서비스 API (시그니처)

```ts
createFolder(coupleId, name, userId, parentFolderId: string | null): Promise<string>
getFoldersByParent(coupleId, parentFolderId: string | null, cursor?): Promise<FolderPage>
getAllFolders(coupleId): Promise<Folder[]>
getFolder(coupleId, folderId): Promise<Folder | null>
getFolderAncestors(coupleId, folder: Folder): Promise<Folder[]>
renameFolder(coupleId, folderId, newName): Promise<void>
deleteFolder(coupleId, folderId): Promise<void> // 재귀 삭제
countFolderDescendants(coupleId, folderId): Promise<{ folders: number; photos: number }>
```

### 그리드 레이아웃

```tsx
// 2열 정사각형 그리드
<div className="grid grid-cols-2 gap-0.5">
  {photos.map((photo) => (
    <div key={photo.id} className="aspect-square relative">
      <Image src={photo.thumbnailUrl ?? photo.storageUrl} fill className="object-cover" />
    </div>
  ))}
</div>
```

### 이미지 표시 최적화

- `next/image` 컴포넌트 사용
- 갤러리 그리드: `sizes="50vw"`
