# 페이지 명세: 재테크 대시보드 (/outer)

## 목적

재테크 공간의 홈. 사용자가 사이드바 재테크 섹션의 "홈" 항목으로 진입했을 때 처음 보는 화면이다.

v1 시점에는 환테크가 유일한 실제 기능이므로 **환테크 요약 + 투자/적금 placeholder + 커플 합산 카드**로 구성한다. 투자·적금은 v1.1에서 본격 데이터가 들어오면 카드를 확장한다.

---

## 사용자 스토리

- 사용자로서, 재테크 탭에 들어가면 내가 운영 중인 재테크 활동들의 현재 상태를 한 화면에서 보고 싶다.
- 사용자로서, 파트너와 내가 재테크로 얼마나 벌었는지 합산을 함께 보고 싶다.
- 사용자로서, 환테크 화면으로 빠르게 진입하고 싶다.
- 사용자로서, 아직 준비 중인 기능(투자/적금)이 무엇이고 언제 들어올지 예상할 수 있으면 좋겠다.

---

## 정보 구조

```
/outer                            → 재테크 대시보드 (이 문서)
  ↘ /outer/forex                  → 환테크 통화 목록 (forex.md)
  ↘ /outer/investment             → 투자 placeholder (investment.md)
  ↘ /outer/savings                → 적금 placeholder (savings.md)
```

- 진입점: 사이드바 재테크 섹션의 "홈" 항목
- 사이드바 재테크 섹션: 홈(/outer) · 환테크(/outer/forex) · 투자(/outer/investment) · 적금(/outer/savings)

---

## UI 구성

```
┌───────────────────────────────┐
│ [☰]                ⚙️  [👤]    │  ← AppShell 상단 (메뉴 버튼 → 사이드바)
├───────────────────────────────┤
│                               │
│  안녕하세요, 진송 👋          │
│                               │
│  ┌─ 우리 합산 ──────────────┐ │  ← CoupleSummaryCard
│  │ 이번 달 환차익            │ │
│  │ +₩ 132,400                │ │
│  │ ─────────────             │ │
│  │ 진송 +₩ 102,400          │ │
│  │ 배우자 +₩ 30,000         │ │
│  └──────────────────────────┘ │
│                               │
│  ┌─ 💱 환테크 ────────────→─┐ │  ← ForexSummaryCard
│  │ USD 1,380.5 ▲ 0.3%       │ │
│  │ 매수 우호                 │ │
│  └──────────────────────────┘ │
│                               │
│  ┌─ 📈 투자 ────── v1.1 ───┐ │  ← PlaceholderCard
│  │ 곧 만나요                 │ │
│  │ 종목 보유·평가액 관리     │ │
│  └──────────────────────────┘ │
│                               │
│  ┌─ 🐖 적금 ────── v1.1 ───┐ │  ← PlaceholderCard
│  │ 곧 만나요                 │ │
│  │ 적금 만기·이율 추적       │ │
│  └──────────────────────────┘ │
│                               │
└───────────────────────────────┘

(페이지 이동은 헤더 [☰] → 사이드바에서. 상시 하단 네비 없음)
```

### 카드 명세

#### 1. CoupleSummaryCard (커플 합산)

- **데이터 출처**: `couples/{coupleId}/meta/outerSummary` (v1.1)
- **v1 표시**: `meta/outerSummary` 문서가 아직 없으므로 **숨김 처리**. 환테크 카드만 노출.
- **v1.1 진입 시**:
  - 상단: 이번 달 환차익 합산 (`combined.totalRealizedPnlKrw` — 단, 월별 필터링은 클라이언트에서 거래일자 기준 산출)
  - 하단: 본인/파트너 각각의 환차익
  - 본인 닉네임은 표시, 파트너는 `displayName` (보안상 문제 없음, 합산은 공동 정보)
- **로딩**: Skeleton
- **에러**: "합산을 불러오지 못했어요" + 재시도 버튼

#### 2. ForexSummaryCard (환테크)

- **데이터 출처**: `/api/forex/rates?currency=USD&range=1w` (기존 환테크 API 재사용)
- **표시**: 대표 통화(USD) 현재가 + 등락률 + 추천 뱃지(`computeRecommendation`)
- **인터랙션**: 카드 전체가 `Link` → `/outer/forex`
- **로딩**: Skeleton
- **에러**: 카드 영역 안에 "환율을 불러오지 못했어요" — 다른 카드는 정상

#### 3. PlaceholderCard (투자/적금)

- **표시**: 아이콘 + 영역명 + `v1.1` 뱃지 + 한 줄 설명("곧 만나요" + 부제)
- **인터랙션**:
  - 클릭 → `/outer/investment` 또는 `/outer/savings`로 이동 (해당 placeholder 페이지가 동일한 "준비 중" 메시지를 안내)
- **스타일**: 배경을 살짝 muted 처리해 활성 카드와 시각적으로 구분

---

## 동작 규칙

- **v1**: 환테크 카드만 노출. CoupleSummaryCard는 향후 진입을 위한 placeholder 자리(아예 빈 영역)로 둔다 — 두 placeholder 카드 사이가 비어 보이지 않도록 환테크 카드를 페이지 상단에 배치하고, 합산 카드는 v1.1에서 추가한다.
- **로그인 필요**: 비로그인 사용자가 `/outer`로 직접 접근하면 `/`로 리다이렉트 (AppShell 공통 가드)
- **커플 연결 미완료**: 온보딩 미완 사용자는 `/onboarding`으로 리다이렉트 (AppShell 공통 가드)
- **`meta/outerSummary` 존재 여부**: v1에서는 문서가 없을 수 있으므로 `useDoc`/`getDoc` 결과 null 처리. 카드 자체를 숨긴다.

---

## 도메인 타입

새 도메인 타입은 도입하지 않는다. 이 페이지는 기존 `OuterSummary`(03-domain-models.md)와 환테크 API만 소비한다.

---

## 테스트 시나리오 (E2E)

| 시나리오                                | 기대 동작                                                          |
| --------------------------------------- | ------------------------------------------------------------------ |
| 로그인 + 커플 연결 완료 사용자가 `/outer` 진입 | 재테크 대시보드 노출, 환테크 카드와 placeholder 2개 표시             |
| 환테크 카드 탭                          | `/outer/forex`로 이동                                              |
| 투자 placeholder 카드 탭                | `/outer/investment`로 이동, "v1.1 준비 중" 안내 페이지 표시        |
| 적금 placeholder 카드 탭                | `/outer/savings`로 이동, "v1.1 준비 중" 안내 페이지 표시           |
| 환율 API 503                            | 환테크 카드만 에러 메시지, placeholder 카드는 정상                 |
| 비로그인 직접 진입                      | `/`로 리다이렉트                                                   |

Frankfurter API는 `route.fulfill()`로 모킹 (`docs/05-testing-strategy.md` 패턴).

---

## 관련 문서

- `docs/08-spaces.md` — 두 공간 구조 + 데이터 소유 모델
- `docs/pages/outer/forex.md` — 환테크 상세
- `docs/pages/outer/investment.md` — 투자 placeholder (v1)
- `docs/pages/outer/savings.md` — 적금 placeholder (v1)
- `docs/03-domain-models.md` — `OuterSummary` 타입
