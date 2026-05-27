# UANDI — 프로젝트 개요

## 비전

신혼부부가 **두 공간**에서 함께 살림을 꾸리는 프라이빗 앱.

- **우리집** — 둘만의 일상을 정리하는 공동 공간 (가계부, 갤러리)
- **재테크** — 가정에 보탬이 될 수익 활동을 관리하는 개인 공간 (환테크, 투자, 적금)

우리집은 커플이 공동으로 소유하고, 재테크는 각자 개인이 소유하되 커플 대시보드에서 합산해 함께 본다.

## 핵심 사용자

- **대상**: 신혼부부 (커플 단위 사용)
- **사용 맥락**: 모바일 우선 / 가끔 데스크탑
- **핵심 가치**: 간결함, 프라이버시, 둘만의 공간 + 함께 벌이

---

## 두 공간 구조

자세한 정의·경계·데이터 소유 모델은 `08-spaces.md` 참고.

| 공간       | 소유      | 영역                         | 라우팅       |
| ---------- | --------- | ---------------------------- | ------------ |
| **우리집** | 커플 공동 | 가계부, 갤러리, 대시보드     | `/inner/*`   |
| **재테크**   | 개인 소유 | 환테크, 투자, 적금, 대시보드 | `/outer/*`   |

네비게이션은 **상단 공간 스위처 + 공간별 하단탭** 구조다.

---

## 기능 범위 (v1 = 7월 출시)

### 우리집

| 영역     | 기능                            | 우선순위 |
| -------- | ------------------------------- | -------- |
| 인증     | 구글 소셜 로그인                | P0       |
| 인증     | 커플 연결 (초대 코드)           | P0       |
| 사진     | 사진 업로드 (폴더·태그 지정)    | P0       |
| 사진     | 사진 갤러리 (전체/폴더/태그 탭) | P0       |
| 사진     | 사진 상세 감상                  | P0       |
| 사진     | 업로더(나/연인) 구분 뱃지+필터  | P0       |
| 사진     | 슬라이드쇼 (폴더/태그 단위)     | P0       |
| 가계부   | 수입/지출 내역 추가             | P0       |
| 가계부   | 월별 내역 조회                  | P0       |
| 가계부   | 월별 요약 (수입/지출/잔액)      | P0       |
| 사진     | 폴더 관리 (생성/이름변경/삭제)  | P0       |
| 사진     | 검색 (파일명/폴더명/태그)       | P1       |
| 가계부   | 카테고리별 통계                 | P1       |
| 대시보드 | 최근 사진 / 이번 달 가계부 요약 | P1       |

### 재테크 (v1: 셸 + 환테크 이주)

| 영역     | 기능                                              | 우선순위 |
| -------- | ------------------------------------------------- | -------- |
| 셸       | 공간 스위처 + 재테크 하단탭                         | P0       |
| 환테크   | 통화별 환율 차트 + 지표 + AI 전망 (기존 이주)     | P0       |
| 대시보드 | 재테크 요약 (개인 환차익 + 커플 합산)               | P0       |
| 투자     | placeholder("v1.1 준비 중")                       | P0       |
| 적금     | placeholder("v1.1 준비 중")                       | P0       |

> **v1.1 이후**: 투자 포지션 관리, 적금 트래커, 재테크 합산 통계 상세.

> **P0**: v1(7월 출시)에 포함 / **P1**: 이후 단계 추가

---

## 페이지 구성

```
/                            → 랜딩(비로그인) / 대시보드(로그인)
/onboarding                  → 최초 가입 + 커플 연결

# 우리집 (커플 공동)
/inner                       → 우리집 대시보드 (최근 사진 + 이번 달 가계부 요약)
/inner/photos                → 사진 갤러리 (전체/폴더/태그 탭)
/inner/photos/[id]           → 사진 상세
/inner/photos/folder/[folderId]
/inner/photos/tag/[tagName]
/inner/photos/slideshow
/inner/cashbook              → 가계부

# 재테크 (개인 소유, 커플 합산)
/outer                       → 재테크 대시보드 (개인 환차익 + 커플 합산)
/outer/forex                 → 환테크 통화 목록
/outer/forex/[currency]      → 통화별 환율 차트 + AI 전망
/outer/investment            → (v1: placeholder, v1.1: 포지션 관리)
/outer/savings               → (v1: placeholder, v1.1: 적금 트래커)
```

> **기존 경로 처리**: 출시 전 단계이므로 기존 경로(`/photos`, `/cashbook`, `/investment/*`)는 redirect 없이 새 경로로 완전 대체한다. 내부 링크·테스트 경로를 모두 새 prefix 기준으로 갱신한다.

### 페이지 명세 파일

`docs/pages/`는 두 공간 구조를 따라 `inner/`·`outer/` 디렉터리로 분리되어 있다.

**공통 (영역 횡단)**

| 파일                       | 경로            | 설명                              |
| -------------------------- | --------------- | --------------------------------- |
| `pages/00-landing.md`      | `/` (비로그인)  | 랜딩 + Google 로그인              |
| `pages/01-onboarding.md`   | `/onboarding`   | 커플 연결                         |
| `pages/02-dashboard.md`    | `/` (로그인)    | 진입 대시보드 (양쪽 공간 요약)    |
| `pages/05-ai-features.md`  | (API 공통)      | AI 라우트 공통 규칙               |

**🏠 우리집 (`pages/inner/*`)**

| 파일                                    | 경로                                           |
| --------------------------------------- | ---------------------------------------------- |
| `pages/inner/photo-gallery.md`          | `/inner/photos`, `/inner/photos/[id]` 등       |
| `pages/inner/gallery-scaffold.md`       | 갤러리 스캐폴드                                |
| `pages/inner/photo-upload-detail.md`    | 사진 업로드·상세                               |
| `pages/inner/filter-select-move.md`     | 필터·선택·이동                                 |
| `pages/inner/slideshow.md`              | `/inner/photos/slideshow`                      |
| `pages/inner/cashbook.md`               | `/inner/cashbook`                              |
| `pages/inner/cashbook-categories.md`    | `/inner/cashbook/categories`                   |
| `pages/inner/cashbook-annual-plan.md`   | `/inner/cashbook/plan/annual`                  |
| `pages/inner/cashbook-monthly.md`       | `/inner/cashbook/monthly`                      |
| `pages/inner/cashbook-weekly.md`        | `/inner/cashbook/weekly`                       |
| `pages/inner/cashbook-notifications.md` | 가계부 알림                                    |

**💼 재테크 (`pages/outer/*`)**

| 파일                              | 경로                                  | 비고          |
| --------------------------------- | ------------------------------------- | ------------- |
| `pages/outer/dashboard.md`        | `/outer`                              | 재테크 대시보드 |
| `pages/outer/forex.md`            | `/outer/forex`, `/outer/forex/[c]`    | 환테크        |
| `pages/outer/investment.md`       | `/outer/investment`                   | v1.1 준비 중  |
| `pages/outer/savings.md`          | `/outer/savings`                      | v1.1 준비 중  |

---

## 문서 읽는 순서

AI가 구현을 시작하기 전에 아래 순서로 문서를 읽어야 합니다.

1. `00-overview.md` ← 지금 이 문서
2. `01-tech-stack.md` — 사용 기술과 버전, 모노레포 구조
3. `02-design-system.md` — shadcn 기반 디자인 시스템, 컴포넌트 규칙
4. `03-domain-models.md` — 데이터 구조 (Firestore 스키마, 우리집/재테크 소유 분리)
5. `04-auth-flow.md` — 인증 및 커플 연결 로직
6. `05-testing-strategy.md` — E2E 테스트 전략 및 패턴
7. `06-docs-site.md` — 문서 뷰어 사이트 명세
8. `08-spaces.md` — 두 공간(우리집/재테크) 정의·경계·소유 모델
9. `pages/[해당 페이지].md` — 구현 대상 페이지 명세

구현 요청 방식(E2E 테스트 우선 사이클)은 `ai-workflow.md`를 참고하세요.
