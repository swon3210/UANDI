# 사용 분석 (Firebase Analytics / GA4)

사용자가 앱을 어떻게 쓰는지(가입 → 커플 연결 → 첫 기록 → 재방문) 보기 위한 행동 분석.
Firebase 프로젝트에 연결된 GA4 속성 하나로 웹·앱(WebView) 데이터를 함께 받는다.

## 원칙

- **가계부 내용은 보내지 않는다.** 금액, 메모, 카테고리 이름, 사진 태그, 이메일·이름 등은 이벤트 파라미터에 넣지 않는다.
  파라미터는 정해진 값(enum)과 개수만 허용한다.
- **URL도 정리해서 보낸다.** 자동 page_view를 끄고 직접 보내며, 쿼리스트링은 버리고 아래 경로 세그먼트는 가린다.
  - `/invite/{code}` → `/invite/:code`
  - `/inner/photos/tag/{tagName}` → `/inner/photos/tag/:tag`
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
3. GA4 관리 → 데이터 스트림(웹) → 향상된 측정 → **「브라우저 기록 이벤트 기반 페이지 변경」 끄기** (직접 보내는 page_view와 중복·원본 URL 노출 방지)
4. GA4 관리 → 맞춤 정의 → 사용자 범위 `client_platform`, `has_couple` / 이벤트 범위 `source`, `method` 등록
5. Vercel `uandi-web` Production 환경변수에 `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` 추가 후 재배포
6. 개인정보처리방침(`/privacy`), Play 데이터 보안 양식, App Store 개인정보 라벨 갱신
