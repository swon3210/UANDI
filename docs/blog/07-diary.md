# 개발 블로그 — 7단계: 비공개 일기 (/diary)

## 목적

블로그와 같은 앱 안에서, 블로그 글과는 분리된 **개인 일기**를 쓰고 고칠 수 있게 한다.
블로그 어디에도 진입점을 두지 않고(비연결·unlisted), URL을 아는 사람만 들어온다.
글쓰기 경험은 브런치(brunch.co.kr)처럼 — 명조 본문, 선택 시 뜨는 서식 메뉴, 빈 줄의 삽입 메뉴.

블로그 글(`content/posts/*.md`)과는 완전히 별개다. 일기는 마크다운 파일이 아니라
Firestore에 저장되고, 빌드 없이 브라우저에서 바로 쓰고 고친다.

---

## 접근 정책 (핵심)

| 대상                        | 목록(`/diary`) | 개별 글(`/diary/{id}`)   | 쓰기·수정·삭제 |
| --------------------------- | -------------- | ------------------------ | -------------- |
| 주인 (`swon3210@gmail.com`) | ✅             | ✅                       | ✅             |
| 링크를 받은 사람            | ❌             | ✅                       | ❌             |
| 그 외                       | ❌             | (URL을 모르면 도달 불가) | ❌             |

- **진입점 없음**: 헤더·푸터·홈·카테고리·태그·아카이브·검색·RSS 어디에도 링크하지 않는다.
  `/diary` 경로에서는 블로그 헤더/푸터 자체를 렌더링하지 않는다 (`SiteChrome`).
- **색인 차단**: 모든 `/diary` 페이지 metadata에 `robots: { index: false, follow: false }`.
  `robots.txt`에는 **적지 않는다** — disallow 목록에 적는 순간 URL이 공개되기 때문.
- **열거 차단**: Firestore 규칙에서 `get`은 공개, `list`는 주인만. 공개 read를 열어도
  다른 사람이 SDK로 전체 목록을 훑을 수 없다.
- 링크를 아는 사람이 개별 글을 읽을 수 있다는 뜻이므로, **정말 아무도 못 보게 하려면**
  규칙의 `allow get: if true;`를 `allow get: if isDiaryOwner();`로 바꾼다.

---

## 라우트

| 경로               | 렌더링     | 설명                                            |
| ------------------ | ---------- | ----------------------------------------------- |
| `/diary`           | 클라이언트 | 목록. 주인만. 커서 페이지네이션(10개 + 더 보기) |
| `/diary/write`     | 클라이언트 | 새 일기 작성                                    |
| `/diary/{id}`      | 클라이언트 | 읽기. 주인에게만 수정·삭제 버튼 노출            |
| `/diary/{id}/edit` | 클라이언트 | 수정 (+ 삭제)                                   |

---

## 데이터 모델 — `diaryEntries/{entryId}`

```ts
type DiaryEntry = {
  id: string;
  title: string;
  contentHtml: string; // Tiptap이 만든 HTML
  excerpt: string; // 목록 카드용 요약 (본문에서 자동 추출, 140자)
  coverImageUrl: string | null;
  authorUid: string;
  createdAt: string | null; // Firestore Timestamp → ISO
  updatedAt: string | null;
};
```

- 정렬: `orderBy('createdAt', 'desc')` — 단일 필드라 복합 인덱스 불필요.
- 조회: `limit(10 + 1)` + `startAfter(cursor)` 커서 페이지네이션 (CLAUDE.md — 전체 스캔 금지).
- 이미지: Firebase Storage `diary/{uid}/{timestamp}-{filename}` (본문 이미지·커버 공용).

---

## 보안 규칙

```
match /diaryEntries/{entryId} {
  function isDiaryOwner() {
    return isAuthed() && request.auth.token.email == 'swon3210@gmail.com';
  }
  allow get: if true;
  allow list: if isDiaryOwner();
  allow create: if isDiaryOwner() && request.resource.data.authorUid == request.auth.uid;
  allow update: if isDiaryOwner() && request.resource.data.authorUid == resource.data.authorUid;
  allow delete: if isDiaryOwner();
}
```

Storage는 `diary/{uid}/**` — 읽기 공개, 쓰기·삭제는 본인 uid 경로만 (10MB, 이미지 MIME만).

> 주인 이메일은 규칙과 앱 양쪽에 있다. 규칙의 문자열이 진짜 권한이고,
> 앱의 `NEXT_PUBLIC_DIARY_OWNER_EMAIL`(기본값 동일)은 버튼을 보여줄지 정하는 용도다.
> 계정을 바꾸면 **둘 다** 바꾸고 `firebase deploy --only firestore:rules,storage`를 해야 한다.

---

## 에디터 (Tiptap v3)

- `StarterKit` (제목 h2·h3, 굵게, 기울임, 밑줄, 취소선, 인용, 목록, 구분선, 링크, 코드)
  \+ `Image` + `Placeholder`.
- **BubbleMenu**: 텍스트를 선택하면 뜨는 알약형 메뉴 — 제목/소제목/B/I/U/S/인용/링크.
- **FloatingMenu**: 빈 줄에 커서를 두면 뜨는 삽입 메뉴 — 사진/목록/인용/구분선.
- 에디터와 읽기 화면이 **같은 `.diary-prose` 클래스**를 쓴다. 쓰는 화면과 보이는 화면이
  어긋나지 않게 하기 위한 것 (진짜 WYSIWYG).
- 본문 HTML은 주인만 쓸 수 있으므로 읽기 화면에서 `dangerouslySetInnerHTML`로 그대로 그린다.

---

## 환경변수 (`apps/blog/.env.local` / Vercel)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
# 선택: 주인 계정을 바꿀 때 (기본값 swon3210@gmail.com)
NEXT_PUBLIC_DIARY_OWNER_EMAIL=
# 로컬 에뮬레이터로 붙을 때만
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
```

Firebase 콘솔에서 블로그 도메인(`uandi-blog.vercel.app` 등)을
**Authentication → 승인된 도메인**에 추가해야 Google 로그인 팝업이 열린다.

---

## E2E 테스트

`apps/blog/e2e/specs/diary.spec.ts` — Firebase 에뮬레이터에서 돈다.

```bash
pnpm emulators          # 터미널 1
pnpm test:e2e:blog      # 터미널 2 (= pnpm --filter blog test:e2e)
```

덮는 범위: 블로그에 진입점이 없다 / 로그아웃 상태는 목록 대신 로그인 안내 / noindex /
쓰기·수정·삭제 한 바퀴 / 서식(소제목·인용)과 이미지 업로드가 읽기 화면까지 이어짐 /
링크를 받은 방문자는 글은 읽고 목록·수정은 막힘 / 남의 계정은 전부 막힘 / 10개 + 더 보기.

Google 팝업 로그인은 `apis.google.com`이 필요해 테스트에서 쓰기 어렵다.
에뮬레이터 모드에서만 열리는 `window.__signInWithEmailAndPassword` 훅으로 같은 로그인 상태를 만든다
(apps/web과 같은 방식).

---

## 아직 하지 않은 것

- 임시저장(draft)·자동저장 — 발행 하나만 있다. 저장 전 이탈 시 브라우저 확인창만 띄운다.
- 글별 공개/비공개 토글 — 지금은 컬렉션 전체가 같은 정책이다.
- 이미지 삭제 — 글을 지워도 Storage 파일은 남는다.
- 검색·태그·목록 필터 — 일기는 검색 인덱스(`build-search-index`)에 넣지 않는다.
