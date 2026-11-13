# 말랑 가계부 영어 버전 제공 계획 (2026-11-11)

## 0. 현황 요약 (코드 조사 결과)

| 항목                     | 현재 상태                                                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| i18n 라이브러리          | 없음. `<html lang="ko">`, `manifest.ts`도 `lang: 'ko'` 고정                                                                                                                               |
| web 하드코딩 한국어      | 450개 `.ts/.tsx` 중 **406개 파일**, 약 2,770줄 (주석 제외 추정)                                                                                                                           |
| `packages/ui`            | 38개 파일 / 919줄 (stories 제외). Storybook은 `react-vite`라 Next 전용 i18n 사용 불가                                                                                                     |
| `packages/cashbook-core` | 10개 파일 / 300줄 — `GROUP_LABELS`, `SUB_GROUP_LABELS`, `DEFAULT_CATEGORIES`(이름·설명·예시), `formatRecurrence`("매월 25일"), `formatCurrency`("원")                                     |
| `functions/`             | 푸시 알림 title/body 한국어 (`budgetAlert`, `recurringReminder`, `nudgeAlert`, `sendTestPush`)                                                                                            |
| `apps/mobile`            | `app.json` 앱 이름·iOS 권한 문구, Kotlin 플로팅 버블 "빠른 추가"                                                                                                                          |
| `apps/extension`         | 한국어 9줄                                                                                                                                                                                |
| 날짜                     | `dayjs.locale('ko')` 전역 고정, `'YYYY년 M월 D일'` 같은 한국어 포맷 문자열 21곳                                                                                                           |
| 통화                     | 원화 전용. `toWonAmount`가 **정수로 반올림**, `formatCurrency`가 "원" 접미, `formatCurrencyMan`이 만/억 축약, `toLocaleString('ko-KR')` 150곳                                             |
| 한국어 전용 로직         | `utils/josa.ts`(조사 이/가·을/를, 2곳 사용), `localeCompare(..., 'ko')`                                                                                                                   |
| AI 프롬프트              | 6개 라우트가 "한국어로 작성" 명시. 예시 데이터·few-shot이 한국어·원화 (`analyze-spending`, `parse-entries-core`, `predict-cashflow`, `analyze-category`, `suggest-tags`, `forex-outlook`) |
| API 에러                 | 라우트가 한국어 문자열을 그대로 반환 (`'잘못된 요청입니다'`, `'일일 사용 한도를 초과했습니다'`)                                                                                           |
| 기본 카테고리            | `initDefaultCategories`가 커플 생성 시 **한국어 이름을 Firestore에 저장** → 이름은 사용자 데이터                                                                                          |
| 로고                     | `Logo.tsx` 워드마크가 '말랑' 글자의 Jua 패스 → 영어 워드마크 필요                                                                                                                         |
| 폰트                     | IBM Plex Sans KR (라틴 포함) → 영어 본문 폰트 추가 불필요                                                                                                                                 |
| 법무 페이지              | `/privacy`(442줄), `/support`, `/account-deletion` 전부 한국어                                                                                                                            |
| 스토어                   | `apps/mobile/store/listings/ko-KR`만 존재. `play-listing.mjs`·`appstore-listing.mjs`는 `--lang` 지원                                                                                      |
| E2E                      | 57개 spec 중 **56개가 한국어 텍스트 locator** 사용                                                                                                                                        |
| 폼/토스트                | Zod 메시지 14곳, toast 84곳                                                                                                                                                               |
| 커뮤니티                 | 한국어 RSS 소스 크롤링 → 영어 사용자에게 줄 콘텐츠 없음                                                                                                                                   |
| 환테크                   | KRW 기준 환율                                                                                                                                                                             |

---

## 1. 먼저 결정할 것 (Phase 0)

### 1-1. 범위: A(UI만 영어) vs B(해외 출시)

|                 | A. UI 언어만 영어                       | B. 해외 출시                                               |
| --------------- | --------------------------------------- | ---------------------------------------------------------- |
| 대상            | 한국 거주 국제 커플, 영어가 편한 사용자 | 미국 등 비원화권                                           |
| 통화            | 원화 유지                               | 다통화(USD 등 소수점 2자리)                                |
| 데이터 모델     | 변경 없음                               | `couples.currency` 추가, 금액을 **최소단위 정수**로 재정의 |
| 환테크·커뮤니티 | 그대로                                  | 숨김 또는 재설계                                           |
| 법무            | 번역                                    | 번역 + 관할 검토                                           |
| 스토어          | en-US 등록정보 추가                     | en-US + 국가 배포 설정                                     |

**결정(2026-11-12): A로 시작한다. B를 막지 않는 구조로 간다.**

- 금액 포맷은 `formatCurrency(amount, { locale, currency })` 하나로 모은다. 지금은 `currency = 'KRW'` 고정.
- 금액 저장은 "통화의 최소단위 정수"로 정의한다. KRW는 최소단위 = 1원이라 **기존 데이터 마이그레이션 없이** B로 갈 수 있다. (`toWonAmount` → `toMinorUnit(amount, currency)`)

### 1-2. 영어 제품명

'말랑 가계부'의 영어 표기 결정 필요. 후보: `Malang`, `Malang Budget`, `Malang Couple Budget`.
워드마크 SVG(`Logo.tsx`)와 스토어 title, 푸시 title(현재 `'UANDI 가계부'`로 남아 있음)을 함께 바꾼다.

### 1-3. 로케일 결정 방식 (URL prefix 금지)

`/en/...` URL 프리픽스는 쓰지 않는다. 이유: 모바일 단일 WebView 딥링크(`uandi-web.vercel.app` intent filter), `middleware.ts` 경로 규칙, 57개 E2E 경로, 어드민 호스트 분기가 전부 깨진다.

대신:

1. `users/{uid}.locale` (`'ko' | 'en'`) — 서버(AI 라우트·Cloud Functions 푸시)가 읽는 단일 소스
2. 쿠키 `uandi-locale` — SSR 첫 렌더용. 로그인 시 user doc 값으로 동기화
3. 첫 방문(쿠키 없음)은 `Accept-Language`로 추정
4. `/settings`에 언어 전환 항목 추가

---

## 2. 기술 선택

| 영역          | 선택                                                                                                                  | 이유                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| web           | `next-intl` (**라우팅 없이** `getRequestConfig`로 쿠키 읽기)                                                          | App Router 서버/클라 모두 지원, ICU 복수형                                                 |
| packages/ui   | `use-intl` (next-intl의 프레임워크 무관 코어)                                                                         | Storybook react-vite에서 동작. `preview.ts`에 `IntlProvider` 데코레이터 + 툴바 locale 전환 |
| cashbook-core | 문자열 제거 → **키/enum만 반환**, 라벨은 호출부에서 `t()`                                                             | 순수 패키지는 로케일을 몰라야 함                                                           |
| functions     | `functions/src/messages/{ko,en}.ts` 템플릿 + user doc `locale` 조회                                                   | web 메시지 파일 공유 시 빌드 경로 문제 → 소량이라 복제                                     |
| 메시지 파일   | `apps/web/messages/{ko,en}/*.json` 네임스페이스별(`shell`, `cashbook`, `photos`, …)                                   | 한 파일 2천 키는 충돌·리뷰 불가                                                            |
| 날짜          | `dayjs` 로케일을 사용자 로케일로 동적 설정 + `localizedFormat` 플러그인(`ll`, `LL`) 또는 `t('date.monthDay', {date})` | 한국어 포맷 문자열 21곳 제거                                                               |
| 통화          | `Intl.NumberFormat(locale, { style: 'currency', currency })`, 축약은 `notation: 'compact'`(en: 1.2M / ko: 120만)      | `formatCurrencyMan` 대체                                                                   |
| 정렬          | `localeCompare(b, locale)`                                                                                            |                                                                                            |
| 조사          | `josa()`는 ko 메시지 안에서만 사용. en 메시지는 조사 자체가 없음                                                      |                                                                                            |

---

## 3. 단계별 작업

### Phase 1 — 기반 (1 PR) — ✅ 2026-11-12 구현 (`feat/i18n-foundation`, 상세 `docs/10-i18n.md`)

- [x] `next-intl` 설치, `layout.tsx`에 `NextIntlClientProvider`, `i18n/request.ts`에 쿠키 기반 `getRequestConfig`
- [x] `users.locale` 필드 + 타입(`docs/03-domain-models.md` 갱신), `uandi-locale` 쿠키, `AuthInit`에서 동기화
- [x] `<html lang>`·`generateMetadata`·`manifest.ts` 로케일 반영
- [x] `/settings` 언어 전환 UI (`LanguageSettingRow`, E2E `settings-language.spec.ts`)
- [x] Storybook 데코레이터/툴바 (`NextIntlClientProvider`; ui 컴포넌트 자체 문자열 추출은 Phase 2)
- [x] 포맷 유틸: `formatCurrency`·`formatAmount`·`formatCurrencyMan`·`formatDate*` 로케일 반영 (`formatRecurrence` 는 Phase 2 cashbook-core 추출 때)
- [x] 가드 2종 스크립트 (`pnpm i18n:check`)
  - `scripts/check-hardcoded-korean.mjs` — src 내 한글 리터럴 검출(허용 목록: 주석, stories, 테스트). CI 연결
  - `scripts/check-message-parity.mjs` — ko/en 키 집합 일치 검사
- [x] Playwright `locale: 'ko-KR'` 고정 → 기존 spec 그대로 유지 (쿠키 대신 브라우저 로케일로 해결)

### Phase 2 — 문자열 추출 (영역별 PR, 사용자 여정 순)

각 PR: 한글 → `ko.json` 키 추출 + `en.json` 작성 + E2E(ko) 통과 + Storybook en 확인.

| 순서 | 영역                                                                           | 규모(파일) | 비고                                                                      |
| ---- | ------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------- |
| 1    | shell / landing / onboarding / outer 인증 / tutorial(5슬라이드) / share-invite | ~25        | 첫 인상 경로                                                              |
| 2    | `packages/ui`                                                                  | 38         | AI 설정 라벨(`aiPreferences.ts`), EmptyState, AppSidebar 등               |
| 3    | `packages/cashbook-core`                                                       | 10         | 라벨 맵 → 키화. `DEFAULT_CATEGORIES`는 §4 참고                            |
| 4    | components/cashbook                                                            | 121        | 가장 큼. plan-wizard / history / categories / settlement 로 3~4개 PR 분할 |
| 5    | components/dashboard                                                           | 31         | 차트 축 라벨(`'M월'`) 포함                                                |
| 6    | app/inner + settings                                                           | ~30        |                                                                           |
| 7    | components/photos                                                              | 40         |                                                                           |
| 8    | investment / outer forex                                                       | ~10        | A 범위면 KRW 문구 유지                                                    |
| 9    | community / admin                                                              | ~15        | 어드민은 운영자용이라 **ko 유지 가능**(후순위)                            |
| 10   | Zod 메시지 14곳, toast 84곳                                                    | —          | 위 PR들에 흡수                                                            |

영어는 한국어보다 평균 30% 길다. 버튼·칩·탭·헤더 제목은 Storybook en에서 overflow를 반드시 본다.

### Phase 3 — 서버 측

- [ ] AI 6개 라우트: 요청에서 user `locale`을 읽어 `instructions`에 응답 언어 지정. 섹션 제목(`## 📊 총정리` 등)·few-shot 예시·`'원'` 표기를 로케일별 템플릿으로 분리
- [ ] `parse-entries-core` few-shot(`'식비'`, `'김치찌개'`)을 en 예시로 병행. 실제 카테고리 목록은 이미 커플 데이터로 넘기므로 매칭 로직은 변경 없음
- [ ] API 에러: 한국어 문자열 대신 **에러 코드** 반환(`{ error: 'RATE_LIMITED' }`), 클라이언트에서 `t()`
- [ ] Cloud Functions 푸시 4종: user `locale` 조회 후 템플릿 선택. `firebase deploy` 수동 배포 필요 (CI 없음)

### Phase 4 — 데이터·기본값

- [ ] `initDefaultCategories(db, coupleId, locale)`: 로케일별 기본 카테고리 세트(이름·설명·예시). 기존 커플은 그대로(카테고리 이름은 사용자 데이터이므로 **런타임 번역하지 않는다**)
- [ ] 한국 특화 항목(명절 용돈, 중고거래 당근·번개장터, 회식) → en 세트는 `Holiday gifts`, `Resale`, `Work socials` 등으로 재구성
- [ ] 투어 슬라이드·온보딩 걷기 문구 en
- [ ] (B 범위일 때만) `couples.currency`, 입력 폼 소수점 허용, `toMinorUnit`

### Phase 5 — 출시 준비

- [ ] 법무: `/privacy`, `/support`, `/account-deletion` 영어본. 개인정보처리방침은 번역만으로 끝나지 않을 수 있어 검토 필요
- [ ] 로고: 영어 워드마크 variant 추가(`Logo variant="full" lang="en"`)
- [ ] 모바일: `app.config.js`에 expo `locales`(iOS `CFBundleDisplayName`·권한 문구 en), Android `strings.xml` en, Kotlin `"빠른 추가"` → 리소스 문자열. 버전 bump 규칙 준수
- [ ] 스토어: `store/listings/en-US/` 작성, 스크린샷 파이프라인(`store-marketing-images.mjs`)을 en 시드·`uandi-locale=en`으로 한 번 더 실행, Play·App Store 로컬라이제이션 업로드
- [ ] 랜딩·OG 메타데이터 en
- [ ] E2E: en 스모크 spec 1~2개(로그인 → 온보딩 → 내역 추가 → 대시보드). 기존 suite는 ko 고정 유지
- [ ] 수동 QA: 영어 전환 상태에서 전 화면 한 바퀴(Storybook en 툴바 + 실기기)

---

## 4. 범위 밖 / 보류

- **커뮤니티**: 한국어 크롤링 콘텐츠라 영어 사용자에게는 탭 숨김(또는 유저 글만). B 범위에서 재검토
- **환테크**: KRW 기준이라 A 범위에서는 문구만 영어. B면 기준 통화 재설계
- **어드민**: 운영자(한국어 사용자) 전용이라 ko 유지
- **블로그(`apps/blog`)·docs-viewer**: 개발기이므로 번역 대상 아님
- **기존 사용자 데이터**(카테고리 이름, 메모, 태그): 번역하지 않음

---

## 5. 작업량 가늠 (하루 1시간 기준)

| Phase    | 세션 수(대략)               |
| -------- | --------------------------- |
| 0 결정   | 1                           |
| 1 기반   | 3~4                         |
| 2 추출   | 15~20 (cashbook만 6~8)      |
| 3 서버   | 3                           |
| 4 데이터 | 2                           |
| 5 출시   | 5~7 (법무·스토어 자산 포함) |

추출 단계는 Claude가 영역별로 기계적으로 진행하고, 사람은 en 문구 톤 리뷰와 overflow 확인에 집중하는 편이 효율적이다.

---

## 6. 명세 문서 갱신 목록

- `docs/01-tech-stack.md` — next-intl/use-intl 추가, 메시지 파일 규약, 하드코딩 금지 규칙
- `docs/02-design-system.md` — 포맷 유틸(통화·날짜) 사용법, 문자열 길이 가이드
- `docs/03-domain-models.md` — `users.locale`, (B) `couples.currency`
- `docs/05-testing-strategy.md` — E2E 로케일 고정, 한글 리터럴 가드, 키 parity
- `docs/pages/*/settings*.md` — 언어 전환
- `CLAUDE.md` — "UI 문자열은 반드시 `t()`" 규칙 추가
