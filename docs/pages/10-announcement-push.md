# 공지 푸시 — 어드민에서 골라 보내기 (`/admin` 「공지 푸시」 탭)

공지사항(`docs/pages/09-announcements.md`) 중 하나를 골라, 운영자가 고른 사용자에게 푸시로 알린다.
예: 「초대 코드 입력 수정」 공지를 짝꿍이 아직 없는 사용자에게만 보낸다.

## 원칙

- **정보성 공지만 보낸다.** 버그 수정·기능 변경·정책 변경 안내만. 이벤트·혜택·홍보 같은 광고성 내용은 보내지 않는다
  (정보통신망법상 광고성 푸시는 별도 수신 동의, 「(광고)」 표기, 야간 별도 동의가 필요하다).
- 공지 원본은 그대로 레포 파일(`apps/web/src/content/announcements.ts`)이다. 어드민은 **어떤 공지를 누구에게 보낼지**만 정한다.
- 사용자가 알림 설정에서 「공지 알림」을 끄면 보내지 않는다.
- 같은 공지는 같은 사용자에게 **한 번만** 보낸다.

## v1 범위

| 포함                                                              | 제외 (후속)                        |
| ----------------------------------------------------------------- | ---------------------------------- |
| 공지 선택 + 대상 선택(사용자 표 체크박스 + 빠른 선택)             | 예약 발송, 반복 발송               |
| 발송 전 미리보기(대상·수신 거부·토큰 없음·이미 보냄·보낼 수 있음) | 공지 원문과 다른 푸시 문구 편집    |
| 확인 다이얼로그(대상 수, 야간 경고) → 발송                        | 발송 취소, 발송 결과 사용자별 상세 |
| 발송 기록(최근 20건)                                              | 오픈율 집계                        |
| 알림 설정 「공지 알림」 끄기                                      |                                    |

## 화면

### 대상 고르기 다이얼로그 (`AdminUserPickerDialog`)

공지 푸시 탭 안에서 대상을 고른다(탭을 오가지 않는다). 2026-11: 사용자 탭 체크박스 방식에서 바꿈.

- 공지 푸시 탭 「대상」의 「대상 고르기」(`admin-push-pick-users`, 이미 골랐으면 「바꾸기」)로 연다.
- `Dialog`(overlay-kit), `data-testid="admin-user-picker"`. 넓은 화면 기준 `max-w-2xl`, 목록은 `max-h-[60vh]`에서 스크롤.
- 구성(위에서 아래로)
  1. 검색 `Input`(이름·이메일·짝꿍 이메일 부분 일치, 사용자 표와 같은 규칙) — `admin-picker-search`
  2. **빠른 선택** 버튼(`variant="outline" size="sm"`). 누르면 선택을 그 조건으로 **바꾼다**(누적 아님).

     | 버튼      | 조건                                               | testid                       |
     | --------- | -------------------------------------------------- | ---------------------------- |
     | 전체      | 모든 사용자                                        | `admin-quick-select-all`     |
     | Android   | 플랫폼에 Android가 있는 사용자                     | `admin-quick-select-android` |
     | iOS       | 플랫폼에 iOS가 있는 사용자                         | `admin-quick-select-ios`     |
     | 짝꿍 없음 | 커플 미연결 또는 상대 대기 중(`partnerEmail` 없음) | `admin-quick-select-solo`    |
     | 선택 해제 | 선택 비우기                                        | `admin-quick-select-clear`   |

  3. 「보이는 n명 모두 선택」 체크박스(`admin-picker-select-visible`) — 검색된 사용자 전체 선택/해제.
  4. 사용자 목록 — 행 전체가 체크박스 라벨(`admin-picker-row`, 체크박스 `admin-picker-check`).
     사진·이름·이메일(`admin-picker-email`)·짝꿍 상태(연결/상대 대기 중/미연결)·플랫폼 배지. 정렬은 이름순.
  5. 하단: 「n명 선택됨」(`admin-selected-count`) · 「취소」 · 「n명 선택」(`admin-picker-confirm`, 0명이면 「선택 안 함」).

- 다이얼로그 안의 선택은 **임시**다. 「n명 선택」을 눌러야 공지 푸시 탭에 반영되고, 취소·바깥 탭은 버린다.
- 다시 열면 지금 고른 대상이 체크된 상태로 시작한다.
- 사용자 탭(`AdminUserTable`)에는 체크박스를 두지 않는다.

### 공지 푸시 탭 (`data-testid="admin-tab-push"`)

1. **공지** — `Select`로 `ANNOUNCEMENTS` 중 하나(제목 + 날짜). 기본값 없음. `admin-push-announcement`.
   고르면 아래에 푸시 미리보기(제목·본문 첫 줄)를 보여준다.
2. **대상** — 고른 사람이 있으면 「n명」과 「바꾸기」, 없으면 「대상을 골라 주세요」와 「대상 고르기」. 둘 다 대상 고르기 다이얼로그를 연다.
3. **확인** — 공지와 대상이 있으면 서버에 미리보기(`dryRun`)를 요청해 숫자를 보여준다(`admin-push-preview`,
   숫자는 `admin-push-count-{target|opted-out|no-token|already-sent|eligible}`).

   | 항목             | 뜻                                          |
   | ---------------- | ------------------------------------------- |
   | 대상             | 고른 사용자 수                              |
   | 공지 알림 끔     | 알림 설정에서 「공지 알림」을 끈 사람(제외) |
   | 기기 없음        | 푸시 토큰이 없는 사람(제외)                 |
   | 이미 보냄        | 같은 공지를 이미 받은 사람(제외)            |
   | **보낼 수 있음** | 위를 뺀 실제 발송 인원                      |

   제외 순서: 이미 보냄 → 공지 알림 끔 → 기기 없음(한 사람은 한 항목에만 센다).

4. **보내기** — 「n명에게 보내기」(`admin-push-send`). 보낼 수 있는 인원이 0이면 비활성.
   누르면 확인 다이얼로그(overlay-kit):
   - 제목 「n명에게 공지 푸시를 보낼까요?」, 설명에 공지 제목 (`data-testid="admin-push-confirm-dialog"`)
   - 지금이 **21시~8시(KST)**면 경고: 「지금은 밤 시간이에요. 아침에 보내는 걸 권해요.」
   - 「보내기」(`admin-push-confirm`) / 「취소」
5. 결과 toast: 「n명에게 보냈어요」(실패한 기기가 있으면 「· 기기 m대 실패」를 덧붙임). 미리보기·기록을 다시 불러온다.
6. **보낸 기록** — 최근 20건, 최신순(`admin-push-history`의 행 `admin-push-log`):
   보낸 시각(`YYYY.MM.DD HH:mm`) · 공지 제목 · 보낸 사람 수 / 대상 수 · 보낸 운영자 이메일.

## 푸시 메시지

```ts
{
  notification: {
    title: announcement.title,
    body: announcement.body.split('\n')[0], // 본문 첫 줄
  },
  data: {
    click_action: '/announcements?from=push', // 공지사항 목록 → 읽음 처리(대시보드 시트는 다시 안 뜸)
    type: 'announcement',
    announcementId: announcement.id,
  },
}
```

### 푸시로 들어온 공지사항 화면의 ←

- `?from=push`면 ←가 앱 안 이동 기록과 상관없이 **대시보드로 replace** 한다(`BackButton alwaysFallback`).
  - 앱이 꺼져 있거나 백그라운드에서 알림을 탭하면 페이지를 새로 불러오므로 원래도 대시보드로 간다.
  - 앱을 쓰는 중 받은 푸시의 토스트 「보기」는 앱 안 이동(`router.push`)이라, 표시가 없으면 보던 화면으로 돌아간다. 이를 막는다.
- 한계: Android 시스템 뒤로가기는 WebView 방문 기록을 따르므로 이전 화면으로 갈 수 있다(네이티브 변경이 필요해 v1 제외).

## API (어드민 전용 — `verifyAdminEmail`)

### `POST /api/admin/announcements/{announcementId}/push`

body `{ uids: string[]; dryRun: boolean }` (uids 1~1000개, 중복 제거).

1. `announcementId`가 `ANNOUNCEMENTS`에 없으면 404.
2. 이미 보냄: `announcementPushes`에서 `where('announcementId','==',id)` 문서들의 `sentUids` 합집합.
3. 대상별로 `users/{uid}/settings/notifications`의 `announcement.enabled === false`면 공지 알림 끔.
4. 남은 대상의 `users/{uid}/fcmTokens` 조회 — 0개면 기기 없음.
5. `dryRun: true`면 숫자만 돌려준다.
6. 아니면 토큰을 500개씩 나눠 `sendEachForMulticast`로 보내고, 무효 토큰(`registration-token-not-registered` 등)은 삭제한다.
   토큰이 1개라도 성공한 사용자를 `sentUids`로 센다.
7. `announcementPushes/{pushId}`에 기록하고 결과를 돌려준다.

응답:

```ts
type AnnouncementPushResult = {
  targetCount: number;
  optedOutCount: number;
  noTokenCount: number;
  alreadySentCount: number;
  eligibleCount: number;
  // dryRun이 아닐 때만
  pushId?: string;
  sentUserCount?: number;
  successCount?: number; // 기기(토큰) 기준
  failureCount?: number;
};
```

### `GET /api/admin/announcements/pushes`

최근 20건(`orderBy('createdAt','desc').limit(20)`). 각 항목에 공지 제목(`ANNOUNCEMENTS`에서 찾음, 없으면 id).

### 모의 발송 (E2E)

에뮬레이터에는 FCM이 없다. 서버 환경변수 `USE_PUSH_MOCK=true`(`.env.test`)면 FCM을 호출하지 않고
토큰마다 성공으로 처리한다. 단 토큰이 `invalid-`로 시작하면 `messaging/registration-token-not-registered`로 실패시킨다(정리 검증용).
프로덕션에는 이 변수를 넣지 않는다.

## 데이터

### `announcementPushes/{pushId}` (최상위 — 운영 데이터)

```ts
type AnnouncementPush = {
  id: string;
  announcementId: string;
  targetUids: string[]; // 고른 대상
  sentUids: string[]; // 실제로 받은 사용자(토큰 1개 이상 성공)
  optedOutCount: number;
  noTokenCount: number;
  alreadySentCount: number;
  successCount: number; // 기기 기준
  failureCount: number;
  sentByEmail: string;
  createdAt: Timestamp;
};
```

- 보안 규칙: 규칙을 따로 두지 않는다(기본 거부) → 클라이언트 read/write 불가. Admin SDK만.
- 인덱스: `announcementId ==` 단일 필드, `createdAt desc` 단일 필드 — 자동 인덱스로 충분.

### `NotificationSettings.announcement` (추가)

```ts
announcement?: { enabled: boolean }; // 미지정 시 true 취급(기존 사용자 호환)
```

## 알림 설정 — 「공지 알림」

`/inner/cashbook/history/weekly/notifications`의 `NotificationSettingsForm` 맨 아래(「입력 요청 알림」 아래)에 섹션 추가.

- 제목 「공지 알림」, 라벨 「알림 받기」, 설명 「버그 수정이나 기능 변경처럼 꼭 알아야 할 소식을 알려드려요.」
- `Switch` `data-testid="announcement-switch"`, 기본값 켜짐(문서에 없으면 true).
- 저장은 기존 「저장」 버튼으로 함께 저장한다.

## 테스트 (`e2e/specs/admin-announcement-push.spec.ts`)

- 운영자가 공지 푸시 탭의 대상 고르기 다이얼로그에서 4명을 고르면, 공지 푸시 탭 미리보기에 대상 4 · 공지 알림 끔 1 · 기기 없음 1 · 보낼 수 있음 2가 보인다.
- 보내기 → 확인하면 「2명에게 보냈어요」 toast, `announcementPushes` 기록의 `sentUids`가 그 2명이고, 보낸 기록에 한 줄이 생긴다.
- 같은 공지를 같은 사람에게 다시 고르면 이미 보냄으로 빠지고, 보낼 사람이 0이면 보내기 버튼이 비활성이다.
- 무효 토큰(`invalid-…`)은 발송 후 삭제된다.
- 다이얼로그 빠른 선택 「짝꿍 없음」은 짝꿍이 없는 사용자만 고르고, 취소하면 선택이 반영되지 않는다.
- 검색 후 「보이는 n명 모두 선택」은 검색된 사용자만 고른다.
- 허용 목록에 없는 계정이 API를 부르면 403.
- 알림 설정에서 「공지 알림」을 끄고 저장하면 `announcement.enabled`가 false로 저장된다.
- 앱 안에서 다른 화면을 보다가 `/announcements?from=push`로 이동해도 ←는 대시보드로 간다.
