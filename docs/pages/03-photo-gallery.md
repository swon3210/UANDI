# 페이지 명세: 사진 갤러리 (/photos, /photos/[id])

## 목적

커플이 함께 찍은 사진을 업로드하고 감상하는 공간.

---

## 사용자 스토리

- 커플로서, 우리가 함께한 사진들을 보기 좋게 모아보고 싶다.
- 커플로서, 새 사진을 쉽게 업로드하고 설명을 달고 싶다.
- 커플로서, 사진 하나를 크게 보고 캡션도 읽고 싶다.

---

## UI 구성

### 갤러리 목록 (/photos)

```
┌─────────────────────────┐
│  ← 사진              [+] │  ← Header + 업로드 버튼
├─────────────────────────┤
│                         │
│  ┌─────┐ ┌─────┐       │
│  │     │ │     │       │  ← 2열 그리드, 정사각형 썸네일
│  └─────┘ └─────┘       │
│  ┌─────┐ ┌─────┐       │
│  │     │ │     │       │
│  └─────┘ └─────┘       │
│  ...                    │
│                         │
│         (Empty State)   │  ← 사진 없을 때
│         📷              │
│         아직 사진이 없어요│
│         [첫 사진 올리기] │
│                         │
├─────────────────────────┤
│  [홈] [사진] [가계부]   │
└─────────────────────────┘
```

### 사진 업로드 — Bottom Sheet

[+] 버튼 클릭 시 하단에서 Bottom Sheet 등장

```
┌─────────────────────────┐
│  사진 추가               │
│                         │
│  ┌───────────────────┐  │
│  │                   │  │  ← 이미지 미리보기 영역
│  │  [사진 선택하기]   │  │  (파일 선택 전) / 선택 후 미리보기
│  └───────────────────┘  │
│                         │
│  촬영일                 │
│  ┌───────────────────┐  │
│  │  2024-01-15       │  │  ← date input (기본값: 오늘)
│  └───────────────────┘  │
│                         │
│  캡션 (선택)             │
│  ┌───────────────────┐  │
│  │                   │  │  ← textarea, placeholder: "이 순간을 기록해요"
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  업로드            │  │  ← primary, 이미지 선택 시 활성화
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

### 사진 상세 (/photos/[id])

```
┌─────────────────────────┐
│  ←                  [⋮] │  ← 뒤로가기 + 더보기 메뉴 (삭제)
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │                   │  │
│  │   (사진 원본)      │  │  ← 전체 너비, object-contain
│  │                   │  │  ← 핀치 줌 지원 (선택, P1)
│  └───────────────────┘  │
│                         │
│  2024년 1월 15일         │  ← takenAt 포맷
│  홍길동이 올림           │  ← uploadedBy 표시 (displayName)
│                         │
│  이 날 정말 행복했어 ☺   │  ← caption (없으면 영역 숨김)
│                         │
└─────────────────────────┘
```

---

## 기술 명세

### 갤러리 데이터 페칭

```ts
// 무한 스크롤 (TanStack Query + useInfiniteQuery)
query(
  collection(db, `couples/${coupleId}/photos`),
  orderBy('takenAt', 'desc'),
  startAfter(lastDoc), // 페이지네이션 커서
  limit(20)
);
```

- 한 번에 20장 로드
- 스크롤 하단 도달 시 다음 페이지 자동 로드
- 이미지 로딩 중 Skeleton 표시

### 이미지 업로드 흐름

1. 사용자가 파일 선택 (`<input type="file" accept="image/*">`)
2. 클라이언트에서 이미지 리사이즈 (최대 1920px, quality 85%)
   - `browser-image-compression` 라이브러리 사용 (`pnpm --filter web add browser-image-compression`)
3. Firebase Storage에 업로드 → `storageUrl` 획득
4. Firestore에 Photo 문서 생성
   - `width`, `height`는 업로드 전 이미지에서 추출

```ts
// Storage 업로드 경로
`couples/${coupleId}/photos/${photoId}/original.${ext}`;
```

### 업로드 진행 상태

- Bottom Sheet 내 progress bar 표시 (`0% ~ 100%`)
- 완료 시 Bottom Sheet 닫힘, 갤러리 목록 자동 갱신 (TanStack Query invalidate)

### 사진 삭제

- 상세 페이지 우상단 `[⋮]` 메뉴에서 "삭제" 선택
- 확인 모달 표시: "이 사진을 삭제하면 복구할 수 없어요. 삭제할까요?"
- 확인 시:
  1. Storage 파일 삭제
  2. Firestore 문서 삭제
  3. `/photos`로 이동

### 이미지 표시 최적화

- `next/image` 컴포넌트 사용
- 갤러리 그리드: `sizes="50vw"`
- 상세 페이지: `sizes="100vw"`

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

---

## 관련 문서

- Photo 타입 및 Storage 경로: `03-domain-models.md`
- 디자인 원칙 (Bottom Sheet, Empty State): `02-design-system.md`
