# 사용 분석 (Firebase Analytics / GA4)

사용자가 앱을 어떻게 쓰는지(가입 → 커플 연결 → 첫 기록 → 재방문) 보기 위한 행동 분석.
Firebase 프로젝트에 연결된 GA4 속성 하나로 웹·앱(WebView) 데이터를 함께 받는다.

## 원칙

- **가계부 내용은 보내지 않는다.** 금액, 메모, 카테고리 이름, 사진 태그, 이메일·이름 등은 이벤트 파라미터에 넣지 않는다.
  파라미터는 정해진 값(enum)과 개수만 허용한다.
- **URL도 정리해서 보낸다.** 쿼리스트링은 버리고 아래 경로 세그먼트는 가린 `page_location`을 초기화 전에 지정한다.
  - `/invite/{code}` → `/invite/:code`
  - `/inner/photos/tag/{tagName}` → `/inner/photos/tag/:tag`
- **page_view는 첫 로드만 gtag 자동 전송, 이후 화면 이동은 직접 보낸다.** gtag는 `send_page_view: false`를 무시하고
  첫 로드에 page_view를 자동으로 보낸다(정리된 `page_location` 사용). 그래서 `trackPageView`는 첫 호출을 건너뛴다.
  GA4 향상된 측정은 꺼 둔다 — 켜면 화면 이동(브라우저 기록 변경) 때 page_view가 중복된다.
- **user_id·사용자 속성은 `{ global: true }`로 보낸다.** Firebase 기본 방식(gtag `config` update)은 현재 gtag.js에서
  이후 이벤트에 `uid`·`up.*`가 붙지 않는다. `global`은 gtag `set`을 써서 모든 이벤트에 붙는다.
- **켜는 스위치는 `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` 하나다.** 값이 없거나 에뮬레이터 모드
  (`NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true`)면 아무것도 보내지 않는다. 로컬·E2E·Preview 데이터가 섞이지 않도록
  Vercel에는 **Production 환경에만** 넣는다.
- 웹 SDK(`firebase/analytics`)만 쓴다. 모바일 앱은 WebView라 같은 코드로 수집되고, 앱/웹 구분은 사용자 속성으로 한다.
  (네이티브 SDK로 이벤트를 넘기는 방식은 앱 버전·설치 경로가 필요해질 때 검토)

## 사용자 식별

| 항목                          | 값                          | 비고                                    |
| ----------------------------- | --------------------------- | --------------------------------------- |
| `user_id`                     | Firebase Auth uid           | 웹·앱을 오가는 같은 사람을 한 명으로 셈 |
| 사용자 속성 `client_platform` | `web` \| `android` \| `ios` | 네이티브 브리지로 판별                  |
| 사용자 속성 `has_couple`      | `true` \| `false`           | 커플 연결 여부                          |

사용자 속성은 GA4 관리 → 맞춤 정의에 등록해야 보고서에서 보인다.

## 이벤트

| 이벤트                | 파라미터                                   | 시점                                      |
| --------------------- | ------------------------------------------ | ----------------------------------------- |
| `page_view`           | `page_location`, `page_path` (정리된 경로) | 경로가 바뀔 때                            |
| `sign_up`             | `method`: `google` \| `apple` \| `other`   | 처음 로그인해 사용자 문서를 만들 때       |
| `couple_created`      | —                                          | 온보딩 「처음 시작해요」로 공간 생성 성공 |
| `couple_joined`       | —                                          | 초대 코드로 합류 성공                     |
| `entries_added`       | `source`, `count`                          | 가계부 내역 저장 성공                     |
| `annual_plan_created` | —                                          | 연간 목표(플랜) 생성 성공                 |

`entries_added.source`

| 값          | 진입점                                       |
| ----------- | -------------------------------------------- |
| `history`   | 내역 화면에서 직접 입력                      |
| `quick_add` | 앱 FAB으로 연 빠른 추가 시트                 |
| `bubble`    | 안드로이드 플로팅 버블(`/overlay/quick-add`) |
| `import`    | 명세 가져오기(`/inner/cashbook/import`)      |

AI 분석 리포트 열람 같은 화면 단위 지표는 별도 이벤트 없이 `page_view`의 `page_path`로 본다.

## 구현 위치

- `apps/web/src/lib/analytics.ts` — 초기화, `trackEvent`, 경로 정리, 사용자 식별
- `apps/web/src/components/AnalyticsTracker.tsx` — 경로 변경 시 page_view, 로그인 사용자 식별 (Providers에 마운트)

## 운영 설정 (콘솔에서 수동)

1. Firebase 콘솔 → 프로젝트 설정 → 통합 → Google Analytics 사용 설정, 웹 앱의 `measurementId` 확인
2. GA4 관리 → 데이터 수집 → **Google 신호 끄기** (소규모 데이터가 임계값 처리로 가려지는 것 방지)
3. GA4 관리 → 데이터 스트림(웹) → **향상된 측정 토글이 꺼져 있는지 확인**.
   아래에 표시되는 「측정: 페이지 조회」는 끌 수 없는 표준 측정이라 그대로 둔다(첫 로드 page_view는 코드에서 중복을 막는다).
   (확인: 프로덕션에서 `google-analytics.com/g/collect` 요청 중 `en=page_view`가 화면당 한 번만 나가야 한다)
4. GA4 관리 → 맞춤 정의 → 사용자 범위 `client_platform`, `has_couple` / 이벤트 범위 `source`, `method` 등록
5. Vercel `uandi-web` Production 환경변수에 `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` 추가 후 재배포
6. 개인정보처리방침(`/privacy`), Play 데이터 보안 양식, App Store 개인정보 라벨 갱신
