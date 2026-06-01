# 페이지 명세: 커뮤니티 피드 (/community)

## 목적

신혼부부가 모여 신혼 관련 유머·이야기를 함께 보고 웃고 떠드는 **공개 커뮤니티 공간**.
v1은 **혼합 피드** — 유저가 직접 쓴 글과 자동 스크래핑한 외부 유머 링크를 한 피드에 섞어 보여준다.

> **두 공간 모델과의 차이 (중요)**
>
> UANDI의 우리집(`/inner`)·재테크(`/outer`)는 모두 **커플 단위로 격리된 프라이빗 데이터**다.
> 커뮤니티는 이 모델을 **의도적으로 벗어나는 첫 전역(공유) 공간**이다.
> - 데이터는 `couples/{coupleId}/*`가 아니라 **최상위 `communityPosts/*`** 에 저장된다.
> - 모든 로그인 유저에게 공개되며, 다른 커플이 쓴 글이 서로에게 보인다.
> - 따라서 "둘만의 프라이빗 앱"이라는 기존 톤에서 벗어나므로, 작성자 표시·신고 등 공개 커뮤니티용 장치가 추가된다.

---

## 결정 사항 (2026-05)

| 항목 | 결정 |
| ---- | ---- |
| 공간 분류 | 새 세 번째 공간 "커뮤니티" (`/community/*`) |
| 피드 구성 | 유저 글 + 스크래핑 링크 혼합, `type` 구분자 |
| 크롤 실행 | Firebase Cloud Functions `onSchedule` (Admin SDK로 Firestore 직접 쓰기) |
| 스크래핑 모더레이션 | 자동 수집 → `pending` → 관리자 승인 → 노출 |
| 유저 글 모더레이션 | 즉시 노출 + 신고/숨김 (사후 모더레이션) |
| 유저 글 구성 | 본문(필수) + 이미지 1장(선택) |
| 작성자 표시 | 프로필 `displayName` + `photoURL` 스냅샷 (닉네임 편집은 추후) |
| 저작권 가드레일 | 스크래핑은 **메타데이터만** 저장, 원문·이미지 복제 금지, 링크아웃 |

---

## 사용자 스토리

- 신혼부부로서, 여러 사이트에 흩어진 신혼 유머글을 한곳에서 보고 싶다.
- 신혼부부로서, 우리 부부 얘기나 짤을 직접 올려 다른 커플과 공유하고 싶다.
- 신혼부부로서, 부적절한 글은 신고해서 안 보이게 하고 싶다.
- 운영자로서, 자동 수집된 링크를 노출 전에 검토해 부적절·불법 출처를 걸러내고 싶다.

---

## 라우팅

```
/community            → 혼합 피드 (유저 글 + 스크래핑 링크, 최신순)
/community/new        → 글쓰기 (overlay-kit bottom sheet 우선, 모바일은 풀스크린)
/community/[id]       → 유저 글 상세 (이미지·본문 전체)
/community/admin      → 모더레이션 (승인 큐 + 신고 검토) — admin uid만 접근
```

> 스크래핑 링크 카드는 상세 페이지가 없다. 카드/카드 내 "원문 보기"를 누르면 **새 탭으로 원문 링크아웃**한다 (프레이밍·iframe 금지).

---

## 네비게이션

`docs/08-spaces.md`의 AppSidebar에 **세 번째 섹션 "커뮤니티"** 를 추가한다.

| 공간 | 항목 |
| ---- | ---- |
| 우리집 | 홈 · 사진 · 가계부 |
| 재테크 | 홈 · 환테크 · 투자 · 적금 |
| **커뮤니티** | **피드(`/community`)** |

- 활성 항목 판정·사이드바 동작은 기존 규칙과 동일.
- **공간 톤**: 우리집(coral)·재테크(indigo)와 구분되는 별도 accent 1개를 부여한다. 제안: violet 계열 `hsl(262 52% 55%)` (`--community-primary`). 정확한 값은 `02-design-system.md` 토큰 추가 시 확정. `data-space="community"`로 오버라이드.

---

## UI 구성

### 피드 (`/community`)

```
┌─────────────────────────────┐
│  [☰]  커뮤니티        [✏️]   │  ← Header + 글쓰기 버튼
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ 🔗 디시 신혼게시판      │  │  ← scraped 카드
│  │ "신혼 첫 명절 후기.jpg" │  │     OG 썸네일 + 제목
│  │ [OG 썸네일 이미지]      │  │     + 출처 뱃지
│  │ 짧은 발췌 한두 줄...     │  │     클릭 → 원문 새 탭
│  │ 출처 · 2시간 전  원문보기→│  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🙂 민지 · 30분 전   [⋯] │  │  ← user 카드
│  │ 오늘 신랑이 설거지를...   │  │     작성자 + 본문
│  │ [업로드 이미지]          │  │     + 이미지(있으면)
│  └───────────────────────┘  │
│                             │
│         (Empty State)       │  ← 글 없을 때
│         💬                  │
│      아직 글이 없어요         │
│      [첫 글 쓰기]            │
└─────────────────────────────┘
```

- **정렬**: `publishedAt DESC` (스크래핑은 승인 시각, 유저 글은 작성 시각).
- **페이지네이션**: `limit(20)` + `startAfter()` 커서 기반 무한스크롤 (`useInfiniteQuery`).
- **로딩**: 카드 스켈레톤. 전체 화면 로딩이면 `<FullScreenSpinner />`.
- 카드 종류는 `type`으로 분기: `scraped` → `LinkPostCard`, `user` → `UserPostCard`.

### 글쓰기 (`/community/new` — bottom sheet)

```
┌─────────────────────────────┐
│  글쓰기                       │
│                             │
│  본문                        │
│  ┌─────────────────────────┐│
│  │ 무슨 일이 있었나요?       ││  ← textarea (필수, 1~1000자)
│  └─────────────────────────┘│
│                             │
│  [📷 이미지 추가]            │  ← 선택, 1장
│  ┌──────┐                   │
│  │ 미리 │ [x]               │  ← 선택 시 썸네일 미리보기 + 삭제
│  │ 보기 │                   │
│  └──────┘                   │
│                             │
│  ┌─────────────────────────┐│
│  │  올리기                  ││  ← primary, 본문 비면 비활성
│  └─────────────────────────┘│
└─────────────────────────────┘
```

- React Hook Form + Zod + shadcn `<Form>` 패턴 (직접 `<input>` 제어 금지).
- 본문: 1~1000자. 이미지: 선택, 단일 파일, 이미지 MIME만, 최대 5MB.
- 제출 흐름: ① 이미지 있으면 Storage 업로드 → ② Firestore `addDoc`(`type='user'`, `status='published'`).
- 제출 성공 시 Sheet 닫고 피드 invalidate + 성공 토스트(`Sonner`).

### 유저 글 상세 (`/community/[id]`)

- 작성자(아바타+이름+시간), 본문 전체, 이미지(있으면 원본 비율), 신고 버튼.
- 본인 글이면 삭제 버튼. 스크래핑 글로 이 경로 접근 시 404 처리(스크래핑은 상세 없음).

### 신고 / 액션 메뉴 (`[⋯]`)

- 카드 `[⋯]` 메뉴는 글의 소유 관계에 따라 한 가지만 노출한다.
  - **본인 유저 글**: `삭제하기`만.
  - **타인 유저 글 / 스크랩 글**: `신고하기`만. (자기 글에 신고 메뉴는 의미가 없으므로 노출하지 않는다.)
- 신고: overlay-kit 확인 모달 → 사유 선택(스팸/부적절/저작권/기타) → `communityPosts/{id}/reports/{uid}` 작성 → 토스트. 같은 유저는 1회만(문서 id = uid).

### 모더레이션 (`/community/admin`) — admin 전용

```
┌─────────────────────────────┐
│  모더레이션                   │
│  [ 승인 대기 ] [ 신고됨 ]     │  ← Tabs
├─────────────────────────────┤
│  승인 대기 (scraped, pending)│
│  ┌───────────────────────┐  │
│  │ 제목 / 출처 / OG 미리보기│  │
│  │ [원문 확인]  [승인][반려]│  │
│  └───────────────────────┘  │
│                             │
│  신고됨 (reportCount ≥ 1)   │
│  ┌───────────────────────┐  │
│  │ 글 미리보기 / 신고 N건   │  │
│  │ [숨김]  [유지]           │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

- **위치**: 별도 서비스(`apps/web-admin` 등)가 **아니다**. `apps/web` 내부 라우트(`/community/admin`)로 둔다. v1 단계에서 admin은 사실상 운영자 본인뿐이므로 새 앱·배포 타깃·중복 auth를 만드는 건 과한 투자다. admin 기능이 커지면 그때 분리한다.
- **접근 제어 — 보안 핵심**: 권한은 **"라우트를 숨기는 것"이 아니라 서버 측에서 강제**한다.
  - admin 전용 작업(승인 `status='published'`, 숨김 `status='hidden'`, 신고 리셋 등)은 **Next API route에서 admin uid를 검증**한 뒤에만 수행한다. 일반 클라이언트는 이 상태 변경을 직접 못 하도록 Firestore 보안 규칙(`allow update: if false`)으로 막는다.
  - admin UI(`/community/admin`)는 그 서버 엔드포인트를 호출하는 **얇은 껍데기**일 뿐, 화면 노출 차단(비admin → `/community` 리다이렉트)은 편의일 뿐 보안 경계가 아니다.
  - admin uid는 **최상위 `admins/{uid}` Firestore 문서**로 식별한다. 문서가 존재하면 admin. write는 콘솔/Admin SDK만, read는 본인 uid만(가드용).
- **서버 엔드포인트**:
  - `POST /api/community/moderate` — `{ postId, action: 'approve'|'reject'|'hide'|'keep' }`. `verifyAdmin`(Bearer 토큰 verify → `admins/{uid}` 존재 확인) 통과 시에만 처리.
  - `GET /api/community/admin/posts` — pending + reported 목록을 Admin SDK로 조회해 반환. 클라이언트 Firestore rule은 pending/hidden read를 차단하므로 이 경로가 유일.
- 승인 → `status='published'`, `publishedAt = serverTimestamp()`. 반려 → `status='hidden'`.
- 신고됨 → `숨김`은 `status='hidden'`, `유지`는 `reportCount=0` 리셋.
- v1 초기에 admin 페이지 구현이 늦어지면 **Firestore 콘솔에서 직접 상태 변경**으로 대체 가능(임시).

### admin 초기 등록 (1회)

운영자 본인의 uid를 Firebase 콘솔에서 `admins/{uid}` 문서로 1회 생성한다. 별도 부트스트랩 스크립트/엔드포인트는 두지 않는다(self-promote 보안 위험 회피). admin이 늘어나면 그때 콘솔에서 문서 추가.

---

## 데이터 모델

> v1 도입 컬렉션. 확정 시 `docs/03-domain-models.md`에 동일 타입을 반영한다.

```ts
type CommunityPostType = 'user' | 'scraped';
type CommunityPostStatus = 'published' | 'pending' | 'hidden';

type CommunityPost = {
  id: string;
  type: CommunityPostType;
  status: CommunityPostStatus;

  // 공통 표시
  title: string;        // user: 빈 문자열 허용 / scraped: 원문 제목
  body: string;         // user: 본문 / scraped: 짧은 발췌(인용 범위) 또는 ''
  createdAt: Timestamp; // 문서 생성 시각
  publishedAt: Timestamp | null; // 노출 시각(정렬 키). pending이면 null
  reportCount: number;  // 신고 누적(트리거로 갱신)

  // type === 'user' 전용
  author?: {
    uid: string;
    coupleId: string | null;
    displayName: string;  // 작성 시점 프로필명 스냅샷
    photoURL: string | null;
  };
  imageUrl?: string | null; // 유저 업로드 이미지(Storage), 최대 1장

  // type === 'scraped' 전용
  source?: {
    siteName: string;            // 출처 사이트명
    url: string;                 // 원문 링크(링크아웃 대상)
    ogImageUrl: string | null;   // OG 이미지 URL (우리 서버에 복제하지 않음)
    originPublishedAt: Timestamp | null; // 원문 게시일(파싱 가능 시)
    sourceId: string;            // 정규화 URL의 해시 — 중복 수집 방지 키
  };
};
```

**Firestore 경로**: `communityPosts/{postId}` (최상위, 커플 격리 아님)
**신고 경로**: `communityPosts/{postId}/reports/{reporterUid}` (`{ reason: string; createdAt: Timestamp }`)
**Storage 경로(유저 이미지)**: `communityImages/{uid}/{postId}.{ext}`

> **작성자명 편집 대응**: v1은 `author.displayName`을 글에 스냅샷으로 비정규화 저장한다(피드 1페이지당 N번의 프로필 조회를 피하기 위함). 추후 닉네임 편집 기능 추가 시 `users/{uid}.communityNickname`을 도입하고, 변경 시 본인의 기존 글 `author.displayName`을 배치 갱신(또는 Function 트리거)하는 방식으로 전파한다. 이 비정규화 선택은 의도적이다.

---

## 보안 규칙 명세

| 대상 | 읽기 | 쓰기 |
| ---- | ---- | ---- |
| `communityPosts/{id}` | 로그인 유저 + `status == 'published'`만 (목록 쿼리는 반드시 `where('status','==','published')` 포함) | **생성**: 로그인 유저가 `type=='user'`, `status=='published'`, `author.uid==auth.uid`, `reportCount==0`, `source` 없음일 때만. `type=='scraped'` 생성은 클라이언트 불가(Admin SDK 전용). **수정/삭제**: 본인 글만(`author.uid==auth.uid`). 상태 변경(`published→hidden`)은 admin/서버만 |
| `communityPosts/{id}/reports/{uid}` | 본인 신고만 | 로그인 유저가 본인 uid 문서만 생성(중복 신고 차단) |

- **스크래핑 글은 클라이언트가 절대 생성/수정할 수 없다.** Cloud Functions(Admin SDK)만 쓴다.
- **admin 권한**: `status` 임의 변경, 다른 유저 글 숨김은 Functions 콜러블/서버 라우트 또는 콘솔로만. 클라이언트 규칙은 일반 유저 기준으로만 허용.
- Storage: `communityImages/{uid}/{file}` — `allow write: if request.auth.uid == uid`(본인 업로드만), `allow read: if request.auth != null`.

---

## 크롤러 명세 (Cloud Functions `onSchedule`)

`functions/src/community/crawlHumorLinks.ts` (신규). 기존 `functions/` 코드베이스에 추가.

### 소스 선정 (별도 작업)

> **구체적인 크롤 대상 사이트는 이 명세에서 정하지 않는다. 별도 작업으로 진행한다.**
>
> 이번 명세는 **소스 무관(source-agnostic) 아키텍처**만 확정한다 — 소스 어댑터(`parser`)를 갈아끼울 수 있는 구조. 어떤 사이트를 크롤링할지는 아래 이유로 분리한다:
> 1. **소스마다 개별 법적 검토 필요** — robots.txt·이용약관을 사이트별로 확인해야 하며, 자동수집을 금지하는 곳이 많다.
> 2. **소스마다 파서가 다름** — RSS/HTML 구조가 제각각이라 소스별 어댑터를 따로 작성해야 한다.
>
> **소스 선정 기준** (정해진 법적 가드레일 기준):
> - **1순위: RSS/공식 피드** — 발행자가 배포(syndication)를 의도한 것이라 가장 안전. 예: 신혼·결혼 주제 티스토리/네이버 블로그 RSS, 브런치 RSS, 결혼 매거진 RSS, Reddit 공식 API/RSS.
> - **회피**: 네이버 카페, 디시·더쿠·인스티즈·네이트판 등 공식 API가 없고 약관이 자동수집을 금지하는 커뮤니티.
> - 트래픽을 원본으로 돌려줘 발행자가 환영할 만한 곳을 우선해 분쟁 동기를 낮춘다.
>
> **별도 작업 범위**: 후보 사이트 리서치(RSS 유무·robots.txt·약관 확인) → 소스 화이트리스트 확정 → 소스별 파서 작성.

### 동작

1. **스케줄**: `onSchedule('every 6 hours', ...)` (주기는 운영하며 조정).
2. **소스 설정**: 코드 내 화이트리스트 배열(또는 `config/communitySources` 문서). 각 소스: `{ siteName, listUrl, parser }`. **RSS/공식 피드가 있는 소스를 우선**한다. (구체 소스는 위 "소스 선정 (별도 작업)" 참고)
3. **수집 단계** (소스별):
   - `robots.txt` 확인 후 허용 경로만 요청. 요청 간 rate limit(예: 1req/2s).
   - 목록에서 후보 글의 **URL·제목**만 추출.
   - 각 URL의 OG 메타(`og:title`, `og:image`, `og:description`)를 가져와 `title`, `ogImageUrl`, 짧은 발췌(`body`, 인용 범위 1~2문장)로 사용.
4. **중복 제거**: 정규화 URL의 해시를 `source.sourceId`로 두고, 이미 존재하면 skip.
5. **저장**: `communityPosts`에 `type='scraped'`, `status='pending'`, `publishedAt=null`로 생성. (승인 전까지 피드 비노출)

### 저장 금지/허용 (저작권 가드레일)

- ✅ 저장: 제목, 원문 URL, 출처명, OG 이미지 **URL**, 게시일, 짧은 발췌(인용 범위).
- ❌ 금지: 원문 본문 전체 복제, 원문/OG 이미지를 우리 Storage로 다운로드·재호스팅, iframe/프레이밍 임베드.
- OG 이미지는 **원본 URL을 그대로 참조**해 미리보기로만 표시(`next/image` `remotePatterns` 또는 referrer-safe `<img>`). 복제·캐싱하지 않는다.

---

## 법적 가드레일 요약

> 상세 논의 배경은 PR/이슈에 기록. 핵심 원칙만 명세에 고정한다.

1. **스크래핑은 메타데이터 + 링크아웃만.** 원문 전문·이미지 복제 금지. 클릭 시 원 사이트로 트래픽을 보낸다.
2. **순수 링크 제공은 복제·전송이 아님**(대법원 입장)이나, 옆에 붙는 썸네일·발췌가 위험 지점이므로 위 가드레일을 지킨다.
3. **합법 원본에만 링크.** 이미 불법 복제된 콘텐츠로의 링크는 침해 방조가 될 수 있으므로 **승인 큐에서 출처를 검토**한다.
4. **robots.txt·이용약관 준수**, rate limit 적용. 수집 자체가 약관 위반이 되지 않도록 RSS/공식 피드 우선.
5. **테이크다운 대응**: 출처 측 요청 시 해당 글을 즉시 `hidden`/삭제할 수 있는 admin 경로를 유지.
6. **유저 글(UGC)**: 신고·숨김으로 사후 모더레이션. 저작권 침해·부적절 콘텐츠는 신고 누적 시 자동 숨김 + admin 검토.

---

## 기술 명세

### 데이터 페칭 (피드)

```ts
// 무한스크롤 — 승인된 글만, 최신순
query(
  collection(db, 'communityPosts'),
  where('status', '==', 'published'),
  orderBy('publishedAt', 'desc'),
  limit(20),
  startAfter(cursor) // 2페이지부터
);
// useInfiniteQuery로 cursor 관리
```

### 신고 카운트 집계

- 클라이언트가 `reportCount`를 직접 증가시키지 않는다(임의 조작 방지). Firestore rule은 `communityPosts/{id}`의 update를 클라이언트에게 일체 deny.
- `communityPosts/{id}/reports/{uid}` 생성 시 **Cloud Function 트리거 `onCommunityReportCreated`** 가 트랜잭션으로 `reportCount`를 increment하고, **임계치 3건** 도달 시 `status='hidden'`으로 자동 전환한다. 자동 숨김된 글은 신고됨 큐에도 더 이상 노출되지 않으며(이미 hidden), admin은 콘솔/추가 도구로 검토할 수 있다.
- 임계치는 `functions/src/community/onReportCreated.ts`의 `HIDE_THRESHOLD` 상수. 운영하며 조정.

### CRUD

| 작업 | Firebase | TanStack Query |
| ---- | -------- | -------------- |
| 피드 조회 | `getDocs`(cursor) | `useInfiniteQuery` |
| 글 작성 | 이미지 `uploadBytes` → `addDoc` | mutation + invalidate |
| 글 삭제 | `deleteDoc`(+이미지 삭제) | mutation + invalidate |
| 신고 | `setDoc`(reports/{uid}) | mutation |
| 승인/숨김(admin) | `updateDoc`(status) | mutation + invalidate |

### 인덱스 요구사항

| 컬렉션 | 인덱스 | 용도 |
| ------ | ------ | ---- |
| communityPosts | `status ASC, publishedAt DESC` | 피드(승인 글 최신순) |
| communityPosts | `status ASC, createdAt DESC` | admin 승인 대기 큐 |
| communityPosts | `status ASC, reportCount DESC` | admin 신고 검토 |

---

## 컴포넌트 추출 (Storybook 단계 대상)

페이지 조립 전 아래 프레젠테이션 컴포넌트를 추출하고 각각 `*.stories.tsx`를 작성한다.

| 컴포넌트 | 역할 | 주요 스토리(엣지 케이스) |
| -------- | ---- | ------------------------ |
| `CommunityPostCard` | type 분기 래퍼 | user / scraped |
| `UserPostCard` | 유저 글 카드 | 이미지 있음/없음, 긴 본문, 본인 글(삭제 노출) |
| `LinkPostCard` | 스크래핑 링크 카드 | OG 이미지 있음/없음, 긴 제목, 출처 뱃지 |
| `PostAuthor` | 아바타+이름+상대시간 | 사진 없음(이니셜), 긴 이름 |
| `CommunityComposer` | 글쓰기 폼(Sheet) | 빈 상태, 이미지 첨부, 글자수 초과 |
| `ReportMenu` | 신고/삭제 액션 메뉴 | 본인 글 / 타인 글 |
| `CommunityFeedEmpty` | 빈 피드 | (재사용: `@uandi/ui` `EmptyState`) |

> `@uandi/ui` 기존 컴포넌트 우선 사용: `Button`, `Sheet`, `Form`, `Avatar`, `Badge`, `Skeleton`, `Sonner`, `EmptyState`, `FullScreenSpinner`. 새 컴포넌트는 shadcn 카탈로그 확인 후 `packages/ui/src/custom/`에 추가.

---

## E2E 테스트 시나리오 (Firebase Emulator)

> 구현 사이클상 컴포넌트 추출 전에 먼저 작성해 Red 확인.

1. 로그인 유저가 `/community`에서 승인된 글 목록을 본다(스크래핑 pending은 안 보임).
2. 글쓰기 → 본문만 작성 → 피드 최상단에 즉시 노출.
3. 글쓰기 → 이미지 첨부 → 카드에 이미지 표시.
4. 본인 글 삭제 → 피드에서 사라짐.
5. 타인 글 신고 → 같은 유저 재신고 차단.
6. 스크래핑 링크 카드 "원문 보기"는 새 탭(`target=_blank`, `rel=noopener`) + 원문 URL.
7. (admin) 승인 대기 글 승인 → 피드에 노출.
8. 비admin이 `/community/admin` 접근 → `/community`로 리다이렉트.

---

## 관련 문서 / 후속 반영 필요

이 명세 확정 후 아래 횡단 문서에 전파한다:

- `docs/00-overview.md` — 페이지 구성·기능 범위에 커뮤니티 공간 추가.
- `docs/08-spaces.md` — 세 번째 공간 "커뮤니티" 정의(전역 공유 예외), 사이드바 3섹션, community 톤 토큰.
- `docs/03-domain-models.md` — `CommunityPost` 타입·Firestore 스키마·보안 규칙·인덱스 반영.
- `docs/02-design-system.md` — `--community-primary` accent 토큰, 신규 카드 컴포넌트.
- `docs/05-testing-strategy.md` — 전역 컬렉션(커플 격리 예외) E2E 시드 패턴.
