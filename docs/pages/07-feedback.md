# 의견 보내기 — 피드백·버그 제보 (`/settings/feedback`)

사용자가 앱 안에서 버그나 의견을 바로 보낼 수 있게 한다. 운영자는 어드민(`/admin`)의 「피드백」 탭에서 확인하고 상태를 바꾼다.
지금은 문의가 이메일·지인 메시지로만 들어와 재현 정보(기기, 화면, 버전)가 빠지기 쉽다. 이 화면이 그 정보를 자동으로 붙인다.

## v1 범위

| 포함                                                      | 제외 (후속)                                    |
| --------------------------------------------------------- | ---------------------------------------------- |
| 유형(버그/의견/기타) + 내용 + 연락 이메일                 | 새 피드백 알림(FCM·이메일) — 어드민에서만 확인 |
| 스크린샷 **1장** 첨부(선택)                               | 여러 장 첨부, 동영상                           |
| 기기·앱 정보 자동 첨부                                    | 사용자에게 답변을 앱 안에서 보여주기           |
| 어드민 목록(최신순·페이지네이션·유형/상태 필터·상태 변경) | 운영자 메모, 담당자 지정                       |

## 진입점

1. **사이드바 footer** — `AppSidebar`의 `footer` 슬롯에 「의견 보내기」 링크(아이콘 `MessageSquareText`). iOS 네이티브에서도 보인다.
2. **설정 첫 화면**(`/settings`) — 목록에 「의견 보내기」 행 추가(가계부 설정 아래).

> 사이드바는 커플 연결 후 화면에서만 열리므로, 미들웨어상 `/settings/*`가 커플 연결을 요구해도 진입점과 어긋나지 않는다.

## 화면

- 헤더: 제목 「의견 보내기」, 좌측 `BackButton`(`fallbackHref="/settings"`).
- 상단 안내 한 줄: 「불편한 점이나 바라는 점을 알려 주세요. 하나하나 읽어 볼게요.」

### 폼 (React Hook Form + Zod + shadcn `<Form>`)

| 필드                  | UI                                                     | 검증                                                               |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| 유형 `type`           | 세그먼트 버튼 3개: 버그 / 의견 / 기타. 기본값 없음     | 필수 — 「어떤 내용인지 골라 주세요」                               |
| 내용 `content`        | `Textarea`(6줄), 우측 하단 글자 수 `n/2000`            | 필수, 앞뒤 공백 제거 후 10~2000자 — 「10자 이상 적어 주세요」      |
| 연락 이메일 `email`   | `Input type="email"`, 기본값 = 로그인 이메일           | 선택. 비우면 답장을 받지 않음. 값이 있으면 이메일 형식, 254자 이하 |
| 스크린샷 `screenshot` | 「스크린샷 추가」 버튼 → 이미지 선택, 썸네일 + 삭제(X) | 선택. `image/*`만, 원본 20MB 이하. 업로드 전 `compressImage`(≤1MB) |

- 유형이 「버그」일 때 내용 placeholder: 「어떤 화면에서 무엇을 했을 때 어떻게 됐는지 적어 주세요」. 그 외: 「자유롭게 적어 주세요」.
- 폼 아래 안내(작은 글씨): 「앱 버전, 기기 정보, 직전에 보던 화면이 함께 전송돼요. 가계부 내용은 보내지 않아요.」
- 「보내기」 버튼(`Button`, 전체 폭): 제출 중에는 비활성 + 「보내는 중…」.

### 제출 결과

- 성공: toast 「보내 주셔서 고마워요」 → `BackButton`과 같은 규칙으로 이전 화면(없으면 `/settings`)으로 돌아간다.
  GA 이벤트 `feedback_submit` 전송.
- 실패: toast 「보내지 못했어요. 잠시 후 다시 시도해 주세요」. 입력값은 그대로 둔다.
- 스크린샷 업로드는 성공했는데 문서 저장이 실패하면, 올린 파일은 남겨 둔다(규칙상 클라이언트 삭제 불가 — 아래 참고). 재시도하면 같은 `feedbackId`로 다시 저장한다.

## 자동 첨부 정보 (`context`)

| 필드           | 값                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `platform`     | `getClientPlatform()` — `web` \| `android` \| `ios`                                              |
| `userAgent`    | `navigator.userAgent` (512자에서 자름)                                                           |
| `appVersion`   | 웹 빌드 식별자 `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` 앞 7자리, 없으면 `null`                       |
| `previousPath` | `nav-history`의 직전 앱 내 경로(쿼리스트링 제거, analytics와 같은 경로 가림 적용). 없으면 `null` |
| `viewport`     | `"{innerWidth}x{innerHeight}"`                                                                   |

- `uid`, `coupleId`(없으면 `null`), `createdAt`(서버 시각)은 문서 최상위에 둔다.
- 네이티브 앱 버전(versionName)은 브리지가 아직 주입하지 않아 v1에서는 수집하지 않는다(UA로 WebView 여부만 구분).

## 데이터

### Firestore `feedback/{feedbackId}` (최상위 — 커플 격리 예외, 운영 데이터)

```ts
type FeedbackType = 'bug' | 'idea' | 'other';
type FeedbackStatus = 'new' | 'checked' | 'resolved';

type Feedback = {
  id: string;
  uid: string;
  coupleId: string | null;
  type: FeedbackType;
  content: string; // 10~2000자
  contactEmail: string | null;
  screenshotPath: string | null; // Storage 경로 feedback/{uid}/{feedbackId}.{ext}
  context: {
    platform: 'web' | 'android' | 'ios';
    userAgent: string;
    appVersion: string | null;
    previousPath: string | null;
    viewport: string;
  };
  status: FeedbackStatus; // 생성 시 항상 'new'
  createdAt: Timestamp;
  statusUpdatedAt: Timestamp | null; // 어드민이 상태를 바꾼 시각
};
```

- `feedbackId`는 클라이언트에서 먼저 만든다(`doc(collection(db, 'feedback')).id`) — 스크린샷 경로에 쓰기 위해.

### 보안 규칙

- **Firestore** `feedback/{id}`
  - `create`: 로그인 + `uid == auth.uid` + `status == 'new'` + `statusUpdatedAt == null` + `createdAt == request.time`
    - `type in ['bug','idea','other']` + `content`가 10~2000자 문자열 + `contactEmail`은 null 또는 254자 이하 문자열
    - `screenshotPath`는 null 또는 `feedback/{auth.uid}/` 로 시작 + 키 집합 `hasOnly`(위 필드만).
  - `read` / `update` / `delete`: 클라이언트 전면 차단. 조회·상태 변경은 어드민 API(Admin SDK)만.
- **Storage** `feedback/{uid}/{fileName}`
  - `create`: 로그인 + `uid == auth.uid` + 5MB 미만 + `image/*`.
  - `read` / `update` / `delete`: 차단. 어드민 화면은 서버가 발급한 서명 URL(1시간)로 본다.

> 남용 방지: v1은 제출 후 버튼 비활성 + 화면 이탈로 충분하다고 본다. 도배가 생기면 사용자별 하루 개수 제한(요약 문서)을 검토한다.

### 보관·파기

- 접수일로부터 **1년** 보관 후 파기(스크린샷 포함). 회원 탈퇴 시에도 문의 처리 기록으로 1년 보관한다 — `/privacy`에 명시.
- v1의 파기는 운영자가 스크립트로 수동 실행한다(자동 정리는 후속).

## 어드민 (`/admin` 「피드백」 탭)

`docs/pages/06-admin.md` 참고. 기존 화면을 `Tabs`로 나눠 「사용자」 | 「피드백 (신규 n)」.

- API
  - `GET /api/admin/feedback?type=&status=&cursor=` — `verifyAdminEmail`. 최신순 20건, `cursor`는 마지막 문서 id(`startAfter`).
    응답 항목에 작성자 이메일·이름(Auth/`users` 조회), 스크린샷 서명 URL 포함. 신규 개수는 `count()` 1회.
  - `PATCH /api/admin/feedback/{id}` — body `{ status }`. `statusUpdatedAt` 갱신.
- 목록 카드
  - 유형 배지(버그=destructive, 의견=primary, 기타=secondary), 상태 `Select`(신규/확인/해결), 접수 시각(`YYYY.MM.DD HH:mm`)
  - 작성자(사진·이름·이메일), 연락 이메일(로그인 이메일과 다를 때만 별도 표시)
  - 내용 전체(`whitespace-pre-wrap`), 스크린샷 썸네일(누르면 새 탭에서 원본)
  - 플랫폼 배지·앱 버전·직전 화면, UA는 「기기 정보」 접기 영역
- 필터: 유형(전체/버그/의견/기타), 상태(전체/신규/확인/해결). 기본 = 전체·전체.
- 하단 「더 보기」로 다음 페이지. 자동 갱신 없음(새로고침 버튼은 기존 헤더 것 공용).

### 답장 (`/reply-feedback`)

- 문의에 대한 1:1 답장은 **이메일**로 한다(회신처 `contactEmail`). 푸시는 길고 민감한 안내에 맞지 않고, 탈퇴 실패처럼 FCM 토큰이 없는 사용자에겐 닿지 않는다.
- 글은 `.claude/skills/reply-feedback/template.html`을 채워 쓰고(부부 1인칭, 이모티콘 2~3개, 마스코트+로고 서명 고정),
  `scripts/feedback-reply-email.mjs`로 미리보기 → Gmail 임시보관함 초안까지 만든다. **보내기는 유저가 누른다.**
- 이미지는 `apps/web/public/brand/`의 공개 URL만 쓴다(앱 게이트를 통과하는 정적 파일).

### 인덱스

| 컬렉션   | 인덱스 필드                                | 용도                |
| -------- | ------------------------------------------ | ------------------- |
| feedback | `type ASC`, `createdAt DESC`               | 유형 필터           |
| feedback | `status ASC`, `createdAt DESC`             | 상태 필터·신규 개수 |
| feedback | `type ASC`, `status ASC`, `createdAt DESC` | 유형+상태 필터      |

## 분석

- 이벤트 `feedback_submit`, 파라미터 `type`: `bug` \| `idea` \| `other` 만. 내용·이메일은 보내지 않는다. (`docs/09-analytics.md`)

## 개인정보처리방침 (`/privacy`)

- 1항 수집 항목에 「의견 보내기 이용 시: 의견 내용, 연락받을 이메일(선택), 스크린샷(선택), 기기·앱 정보(플랫폼, 브라우저 정보, 앱 버전, 직전 화면 경로)」 추가.
- 2항 처리 목적에 「문의 응대, 오류 확인 및 서비스 개선」 추가.
- 3항 보유기간에 「의견 보내기 기록: 접수일로부터 1년(회원 탈퇴 시에도 동일)」 추가.
- Play 데이터 보안 양식·App Store 개인정보 라벨은 배포 후 수동 갱신(체크리스트로 남김).

## 테스트 (`e2e/specs/feedback.spec.ts`)

픽스처: `authedPage`(커플 연결). 어드민 시나리오는 `admin-users.spec.ts`와 같은 `ADMIN_EMAILS` 테스트 계정.

1. 사이드바 footer 「의견 보내기」 → `/settings/feedback` 진입, 설정 화면 행으로도 진입.
2. 유형 미선택·내용 10자 미만이면 각 오류 메시지가 보이고 제출되지 않는다.
3. 연락 이메일 기본값이 로그인 이메일이다. 잘못된 형식이면 오류.
4. 버그 + 내용 + 스크린샷 1장으로 제출 → toast, 이전 화면 복귀, 에뮬레이터 `feedback` 문서에
   `type/content/uid/status='new'/screenshotPath/context.platform`이 저장된다.
5. 스크린샷 없이 제출 → `screenshotPath == null`.
6. 규칙: 다른 uid로 생성, `status='resolved'`로 생성, 다른 사람의 문서 읽기는 거부(일반 유저 토큰 REST).
7. 어드민 「피드백」 탭: 최신순 표시, 유형 필터, 상태를 「해결」로 바꾸면 새로고침 후에도 유지.
8. 허용 목록에 없는 사용자는 `/api/admin/feedback`에서 403.

## Storybook

- `FeedbackForm` (packages/ui `custom/settings/`) — 기본 / 버그 선택 / 오류 표시 / 스크린샷 첨부 / 제출 중
- `FeedbackTypeSelector` — 미선택 / 선택
- `AdminFeedbackCard` (apps/web `components/admin/` — 기존 어드민 컴포넌트 위치) — 버그+스크린샷 / 의견(스크린샷 없음) / 긴 내용 / 연락 이메일 다름
