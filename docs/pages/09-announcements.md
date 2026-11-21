# 공지사항 — 골라 올린 변경 소식 (`/announcements`)

새 기능, 사라진 기능, 많은 사람이 겪은 버그 수정처럼 **사용자가 꼭 알아야 할 변경만** 골라서 앱 안에서 알린다.
모든 변경 이력(changelog)을 보여주는 화면이 아니다. 레포 파일에 적은 항목만 사용자에게 보인다.

## v1 범위

| 포함                                                     | 제외 (후속)                                         |
| -------------------------------------------------------- | --------------------------------------------------- |
| 레포 파일(`announcements.ts`)에 직접 적은 공지           | Firestore·어드민에서 공지 작성/수정                 |
| 대시보드 진입 시 안 읽은 공지 바텀시트 1회               | 배포 없이 띄우는 긴급 공지(장애·점검) 배너          |
| 사이드바 footer 「공지사항」 → 지난 공지 목록            | 사이드바·☰ 버튼의 안 읽음 표시(빨간 점)            |
| 사용자별 읽음 상태(`users/{uid}.lastSeenAnnouncementId`) | 팝업 없이 목록에만 남기는 공지(`silent`), GA 이벤트 |

> 어드민에서 공지를 골라 특정 사용자에게 푸시로 보내는 기능은 `docs/pages/10-announcement-push.md`.

## 무엇을 공지로 올리나

아래 중 **하나라도** 해당할 때만 `announcements.ts`에 항목을 추가한다. 나머지(작은 개선, 리팩터링, 어드민, 분석)는 올리지 않는다.

1. **쓰던 기능이 사라졌거나 위치가 바뀜** — 안 알리면 사용자가 "고장 났다"고 느낀다.
2. **알아야 쓸 수 있는 새 기능** — 화면 구석에 있어 말하지 않으면 모르는 기능.
3. **많은 사람이 겪은 버그 수정** — "그 문제 이제 괜찮아요"라고 말해 줄 가치가 있는 것만.
4. **데이터·개인정보 정책 변경** — 보관 기간, 수집 항목 등.

빈도는 한 달에 한두 건이 적당하다. 자주 뜨면 습관적으로 닫게 된다.

### 문구 원칙

- 커밋 메시지를 옮기지 않고 **사용자 말**로 쓴다. (`fix: users 문서의 coupleId…` → 「짝꿍 연결이 풀리던 문제를 고쳤어요」)
- 제목은 한 문장, 본문은 두세 문장 이내. 위치가 바뀐 기능은 **새 위치를 화면 이름 그대로** 적는다.
- 해요체. 과장·이모지 없이.

## 데이터

### 공지 원본 — `apps/web/src/content/announcements.ts`

Firestore가 아니라 레포 파일이 단일 소스다. 기능 PR에 공지 항목을 같이 추가해 기능과 공지가 함께 배포되게 한다.

```ts
export type AnnouncementKind = 'new' | 'changed' | 'fixed' | 'ended';

export type Announcement = {
  /** 고유 id. 한 번 배포한 id는 바꾸거나 지우지 않는다(읽음 판정 기준) */
  id: string; // 예: '2026-11-feedback'
  /** 공지 날짜 'YYYY-MM-DD'(KST). 목록 표시와 신규 가입자 판정에 쓴다 */
  date: string;
  kind?: AnnouncementKind;
  title: string; // 한 문장
  body: string; // 줄바꿈(\n) 허용. 마크다운 아님
  /** 선택: 시트·목록에 "바로 가기" 버튼 */
  link?: { label: string; href: string };
  /** 선택: 설명 스크린샷. 본문 아래·바로 가기 위에 전체 폭으로 보인다 */
  image?: { src: string; alt: string; width: number; height: number };
};

/** 최신순(배열 앞이 최신). 새 공지는 맨 앞에 추가한다 */
export const ANNOUNCEMENTS: Announcement[] = [
  /* … */
];
```

| `kind`    | 배지 문구  | 배지 variant |
| --------- | ---------- | ------------ |
| `new`     | 새 기능    | `default`    |
| `changed` | 바뀌었어요 | `secondary`  |
| `fixed`   | 고쳤어요   | `secondary`  |
| `ended`   | 종료       | `outline`    |
| (없음)    | 배지 없음  | —            |

**운영 규칙**

- 배열 **맨 앞에 추가**한다(최신순). 순서가 읽음 판정 기준이다.
- 배포된 공지의 **id는 바꾸거나 지우지 않는다.** 문구는 고쳐도 된다. 정말 내려야 하면 항목을 지우되,
  그 id를 마지막으로 본 사용자는 아래 규칙에 따라 다음 공지 전까지 팝업을 보지 않는다(안전한 쪽).

### 읽음 상태 — `users/{uid}.lastSeenAnnouncementId`

```ts
type User = {
  // …기존 필드
  /** 마지막으로 본 공지 id(공지 시트가 열리거나 공지 목록을 연 시점의 최신 공지). 없으면 아직 본 적 없음 */
  lastSeenAnnouncementId?: string;
};
```

- 사용자별로 저장한다(짝꿍과 따로). localStorage가 아닌 이유: 앱 WebView와 브라우저는 저장소가 따로라
  웹에서 본 공지가 앱에서 다시 뜬다.
- 보안 규칙 변경 없음 — 현재 `users/{uid}` update 규칙(본인만, coupleId 보호)으로 충분하다.

### 안 읽은 공지 판정 — `getUnreadAnnouncements(list, user)` (순수 함수)

1. `lastSeenAnnouncementId`가 있으면: 배열에서 그 id의 위치를 찾아 **그보다 앞(더 최신)** 항목들.
   id를 못 찾으면(지워진 공지) **빈 배열**(팝업 폭탄 방지).
2. 없으면(한 번도 본 적 없음): `date`가 **가입일(`createdAt`, KST 날짜)보다 뒤인** 항목만.
   → 신규 가입자에게 가입 전 공지가 쏟아지지 않는다.

## 화면 1 — 대시보드 공지 시트

### 열리는 조건 (모두 만족)

- 대시보드(`/inner/cashbook`)에 커플 연결 상태로 진입
- 안 읽은 공지가 1개 이상
- **온보딩 투어를 이미 본 상태**(`moa:tour:v1` = true). 이번 방문에 투어가 떴거나 뜰 예정이면 공지는 다음 방문으로 미룬다
  (두 오버레이가 겹치지 않게).
- 화면이 그려지고 투어와 같은 지연(`TOUR_OPEN_DELAY_MS`, 1.5초) 뒤에 연다.
- 같은 화면 수명 동안 한 번만 연다(ref 가드). 외부 시스템(users 문서·localStorage) 상태에 반응하는 일회성 동작이라
  effect를 쓴다(`useCashbookEntryAutoOpen`과 같은 패턴).

### 시트 구성 (overlay-kit + `Sheet side="bottom"`, `rounded-t-[20px] max-h-[90vh]`)

- 제목: 「새 소식」
- 안 읽은 공지를 최신순으로 **최대 3개**. 각 항목:
  - 배지(`kind` 있을 때) + 날짜(`YYYY.MM.DD`, Caption)
  - 제목(Subtitle), 본문(`text-sm`, `whitespace-pre-line`)
  - `image`가 있으면 본문 아래에 스크린샷(`next/image`, 전체 폭, `rounded-xl border`). 글만으로 위치를 찾기 어려운
    설정형 기능(토글·메뉴 깊숙한 곳)에 넣는다. 파일은 `apps/web/public/announcements/`에 두고,
    `e2e/screenshots/announcement-*.screenshots.spec.ts`로 에뮬레이터 데모 데이터에서 캡처한다(실제 사용자 화면 금지).
  - `link`가 있으면 `Button variant="outline" size="sm"` — 누르면 시트를 닫고 `href`로 이동
- 안 읽은 공지가 3개보다 많으면 아래에 「지난 공지 모두 보기」(`ghost`) → `/announcements`
- 하단 「확인」(`default`, 전체 폭) → 닫기

### 읽음 기록

- **시트가 열리는 순간** `lastSeenAnnouncementId = 안 읽은 공지 중 가장 최신 id`로 저장한다(투어와 같은 방식).
  확인·바깥 탭·스와이프 등 어떤 방식으로 닫아도 다시 뜨지 않는다.
- 저장 후 `userAtom`도 같은 값으로 갱신한다(다시 렌더해도 시트를 재판정하지 않도록).
- 저장 실패는 조용히 무시한다(다음 진입에 다시 뜰 뿐). 토스트 없음.

## 화면 2 — 공지사항 목록 (`/announcements`)

### 진입점

- **사이드바 footer**(`AppSidebar`의 `footer` 슬롯) 「공지사항」 링크 — 「의견 보내기」 **위**, 아이콘 `Megaphone`,
  `data-testid="sidebar-announcements-link"`. 누르면 사이드바를 닫고 이동한다.
  - 섹션이 아니라 footer에 두는 이유: 사이드바 섹션은 공간(우리집/재테크/커뮤니티) 단위이고,
    iOS 네이티브에서는 섹션을 「가계부」 하나만 남기지만 footer는 그대로 보인다.
  - 공지사항(서비스 → 사용자)과 의견 보내기(사용자 → 서비스)를 한 묶음으로 둔다.
- 공지 시트의 「지난 공지 모두 보기」.
- 설정(`/settings`) 목록에는 두지 않는다.

### 화면

- 헤더: 제목 「공지사항」, 좌측 `BackButton`(`fallbackHref` 생략 → 대시보드). 사이드바에서 들어오므로 트리상 부모는 대시보드다.
  공지 푸시로 들어온 경우(`?from=push`)는 ←가 항상 대시보드로 간다(`docs/pages/10-announcement-push.md`).
- 라우트 보호: 미들웨어의 로그인·커플 연결 필요 경로에 `/announcements`를 추가한다(사이드바는 커플 연결 후에만 열린다).
- `ANNOUNCEMENTS` 전체를 최신순으로 카드 목록(`rounded-xl border border-border bg-card p-4`, 간격 `space-y-3`).
  카드 내용은 시트 항목과 같다(배지·날짜·제목·본문·링크 버튼). 같은 프레젠테이션 컴포넌트(`AnnouncementItem`)를 쓴다.
- 공지가 0개면 `EmptyState`(아이콘 `Megaphone`, 「아직 공지가 없어요」).
- 진입 시 공지가 1개 이상이면 `lastSeenAnnouncementId`를 최신 id로 저장한다(목록을 봤으면 시트를 띄우지 않는다).
- 페이지네이션 없음 — 레포 파일이라 Firestore 읽기가 없다.

## 컴포넌트

| 컴포넌트                  | 위치                                     | 역할                                      |
| ------------------------- | ---------------------------------------- | ----------------------------------------- |
| `AnnouncementItem`        | `apps/web/src/components/announcements/` | 배지·날짜·제목·본문·링크 (시트·목록 공용) |
| `AnnouncementSheet`       | 〃                                       | 시트 본문(최대 3개 + 모두 보기 + 확인)    |
| `useAnnouncementAutoOpen` | `apps/web/src/hooks/`                    | 대시보드 진입 시 열기 + 읽음 기록         |
| `getUnreadAnnouncements`  | `apps/web/src/lib/announcements.ts`      | 안 읽은 공지 판정(순수 함수)              |

Storybook: `AnnouncementItem`(배지별, 링크 유무, 긴 본문), `AnnouncementSheet`(1개, 3개, 3개 초과).

## 첫 공지 (제안)

| id                        | date       | kind    | 제목                               | 본문 요지                                                                                      | link                                    |
| ------------------------- | ---------- | ------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| `2026-11-feedback`        | 2026-11-15 | `new`   | 앱 안에서 의견을 보낼 수 있어요    | 설정 → 의견 보내기. 스크린샷 한 장도 붙일 수 있어요.                                           | 의견 보내러 가기 → `/settings/feedback` |
| `2026-11-couple-link-fix` | 2026-11-15 | `fixed` | 짝꿍 연결이 풀리던 문제를 고쳤어요 | 다시 로그인했을 때 연결이 끊긴 것처럼 보이던 문제. 아직 풀려 있다면 의견 보내기로 알려 주세요. | —                                       |

## 테스트 (`e2e/specs/announcements.spec.ts`)

공지 내용은 테스트에서 `ANNOUNCEMENTS`를 직접 가져와 비교한다(문구가 바뀌어도 테스트를 고치지 않도록).
`seedUserDocument`에 `createdAt`, `lastSeenAnnouncementId` 옵션을 추가한다.

- 가입일이 공지보다 이전이고 본 적 없는 사용자 → 대시보드 진입 후 시트가 열리고 최신 공지 제목이 보인다.
  「확인」으로 닫고 새로고침하면 다시 열리지 않는다.
- 기본 픽스처(방금 가입) → 시트가 열리지 않는다.
- `lastSeenAnnouncementId` = 최신 id → 시트가 열리지 않는다.
- 안 읽은 공지의 링크 버튼 → 시트가 닫히고 해당 경로로 이동한다.
- 투어를 아직 안 본 사용자(`seedTourSeen: false`) → 투어만 열리고 공지 시트는 열리지 않는다.
- 사이드바 footer 「공지사항」 → 모든 공지가 최신순으로 보이고, ←로 대시보드에 돌아온다. 설정 화면에는 「공지사항」 행이 없다.
- 목록을 본 뒤 대시보드에 가면 시트가 열리지 않는다.
- 공지가 3개를 넘을 때의 「지난 공지 모두 보기」는 Storybook으로 확인한다(실제 공지가 2개라 E2E 대상 아님).

## 기존 화면·문서 변경

- 사이드바 footer: 「공지사항」 링크 추가(「의견 보내기」 위). (2026-11: 설정 목록 → 사이드바로 이동, 경로 `/settings/announcements` → `/announcements`)
- `middleware.ts`: 보호·커플 필요 경로에 `/announcements` 추가.
- `docs/03-domain-models.md`: `User.lastSeenAnnouncementId` 추가.
- `docs/00-overview.md`: 페이지 구성·명세 파일 목록에 추가.
