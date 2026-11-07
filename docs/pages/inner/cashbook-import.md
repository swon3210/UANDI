# 페이지 명세: 지난 내역 가져오기 (/inner/cashbook/import)

## 목적

처음 시작하는 커플이 **통장 내역이나 카드 내역을 올려 한 달치 내역을 한 번에 넣고, 그 내역에 맞는
카테고리까지 한 번에 준비**하는 풀스크린 플로우. 온보딩 직후 진입하며, 빈 대시보드에서도 다시 들어올 수 있다.

신규 커플은 카테고리가 0개로 시작하므로(기본 카테고리 초기화를 호출하는 곳이 없었다), 이 페이지는
"내역 추가"와 "카테고리 초기화"를 한 흐름으로 묶는다.

---

## 사용자 스토리

- 처음 시작한 사용자로서, 지난달 통장·카드 내역을 사진이나 PDF로 올려 한 번에 가계부를 채우고 싶다.
- 처음 시작한 사용자로서, 내가 쓰는 소비 패턴에 맞는 카테고리가 알아서 준비됐으면 좋겠다.
- 처음 시작한 사용자로서, AI가 제안한 새 카테고리를 넣기 전에 이름과 구분(고정/공통/각자)을 고치고 싶다.
- 처음 시작한 사용자로서, 지금은 건너뛰고 나중에 빈 화면에서 다시 들어오고 싶다.

---

## 진입점

| 진입                               | 경로                                  | 비고                         |
| ---------------------------------- | ------------------------------------- | ---------------------------- |
| 온보딩 연결 완료 "시작하기"        | `/inner/cashbook/import?onboarding=1` | 공간을 **만든 사람만**. 코드로 합류한 사람은 대시보드로 바로 간다(`01-onboarding.md`). 건너뛰기 → `/inner/cashbook` |
| 온보딩 코드 화면 "먼저 시작하기"   | `/inner/cashbook/import?onboarding=1` | 동일                         |
| 빈 대시보드 "지난달 내역 불러오기" | `/inner/cashbook/import`              | 뒤로가기(←) → 대시보드       |

- 풀스크린(chromeless) 플로우라 전역 FAB를 숨긴다(`chromeless-routes.ts`에 등록).
- 헤더 좌측은 `onboarding=1`이면 "건너뛰기"(텍스트, `data-testid="import-skip"`), 아니면 `BackButton`.

---

## UI 구성 — 3단계 (한 페이지 안에서 전환)

```
┌─────────────────────────┐
│ 건너뛰기          1·2·3  │  ← 단계 표시 (data-testid="import-step")
├─────────────────────────┤
│  지난 내역을 가져와요     │
│  통장이나 카드 내역을 올리면│
│  내역과 카테고리를 한 번에 │
│  준비해 드려요            │
│                         │
│  [통장 내역] [카드 내역]  │  ← ImportSourcePicker (segmented, data-testid="import-source-*")
│  통장: 카드대금 일괄출금은 빼고 송금은 따로 표시해요 │ ← 선택별 안내 한 줄
│                         │
│  ┌───────────────────┐  │
│  │ 📎 사진·PDF 첨부   │  │  ← 기존 AiParseInput (텍스트 붙여넣기도 가능)
│  │ 붙여넣어도 돼요 ↑  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### 1단계 — 올리기

- `ImportSourcePicker`: `account`(통장) / `card`(카드) 중 하나. 기본 `card`. 선택값은 파싱 요청의 `imageKind`가 된다.
- 첨부·텍스트 입력은 기존 `AiParseInput`을 그대로 쓴다(이미지 10장, PDF 3개·20페이지, 잠긴 PDF 비밀번호 시트 포함).
- 분석 요청: `parseEntriesForImport(text, images, pdfs, { imageKind })`
  - `categories` = **기본 카테고리 이름 목록**(`DEFAULT_CATEGORIES`) + 이미 있는 커플 카테고리 이름(있다면)
  - `allowNewCategories: true` → 서버가 `suggestedCategories[]`를 함께 돌려준다(`05-ai-features.md` 기능 1 참고)
- 분석 중에는 `MascotLoader`(가운데) + "내역을 읽는 중…" 문구.

### 2단계 — 카테고리 확인

```
┌─────────────────────────┐
│ ← 뒤로            1·2·3  │
│  이런 카테고리로 나눴어요  │
│  N건을 M개 카테고리로 나눴어요. 기본 카테고리 23개는 함께 준비돼요 │
│                         │
│  새로 제안된 카테고리 (2)  │  ← SuggestedCategoryList
│  ┌───────────────────┐  │
│  │ ☑ 🐾 반려동물   7건 │  │  ← SuggestedCategoryCard (data-testid="suggested-category")
│  │   지출 · [고정][공통][각자] │  ← 구분 칩 (선택된 것 강조)
│  │   이름 [반려동물      ] │  │  ← 이름 수정 가능
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ ☐ 🚗 자동차     3건 │  │
│  └───────────────────┘  │
│                         │
│  쓰인 기본 카테고리 (6)   │  ← 칩 나열 (읽기 전용): 식비 12 · 교통 4 · …
│                         │
│  ┌───────────────────┐  │
│  │   내역 확인하기 →   │  │  ← data-testid="import-next"
│  └───────────────────┘  │
└─────────────────────────┘
```

- 제안된 카테고리는 기본 **포함(체크)** 상태. 체크를 풀면 그 카테고리를 쓰던 내역은 `기타`로 간다
  (`기타`가 기본 목록에 없으면 함께 만든다 — 현재 기본 목록의 변동 지출(공통) `기타` 사용).
- 이름을 비우면 다음으로 못 간다(인라인 에러). 이름이 기존·기본 카테고리와 같으면 "이미 있는 카테고리예요"로 막는다.
- 구분 칩: 수입이면 정기/비정기, 지출이면 고정/공통/각자. 모델이 제안한 값을 기본으로 둔다.
- 제안이 0개면 이 단계는 "기본 카테고리로 충분해요" 한 줄과 쓰인 카테고리 칩만 보여주고 바로 다음으로 갈 수 있다.

### 3단계 — 내역 확인

- 기존 `AiBulkPreviewSheet`를 **페이지 안에 풀스크린(`fullScreen`)으로** 띄운다. 건별 토글·수정·중복 표시는 그대로.
- "N건 추가" 확정 시 순서:
  1. 커플에 카테고리가 하나도 없으면 `initDefaultCategories(coupleId)` (이미 있으면 생략)
  2. 2단계에서 확정한 새 카테고리를 `addCategory`로 추가 (아이콘·색상은 제안값, 색상은 `COLOR_PRESETS` 순환)
  3. 체크 해제된 제안 카테고리를 쓰던 내역은 `category`를 `기타`로 바꿔 저장
  4. `addEntries(entries)` 일괄 저장 → 토스트 "N건 추가됐어요" → **내역이 가장 많은 달의 대시보드**로 이동(`replace`).
     이번 달이면 `/inner/cashbook`, 아니면 `/inner/cashbook?at=YYYY-MM-01`(월간 뷰 커서). 지난달 명세서를 올렸는데
     이번 달 빈 화면으로 떨어지지 않게 하기 위함.
- 저장 중에는 CTA 비활성 + 스피너. 실패하면 토스트, 단계 유지.

---

## 프레젠테이션 컴포넌트 (`apps/web/src/components/cashbook/`)

| 컴포넌트                | Props                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ImportSourcePicker`    | `value: 'account' \| 'card'`, `onChange`                                                                     |
| `ImportStepIndicator`   | `current: 1 \| 2 \| 3`                                                                                       |
| `SuggestedCategoryCard` | `suggestion: SuggestedCategoryDraft`, `onChange(draft)`, `error?`                                            |
| `SuggestedCategoryList` | `suggestions: SuggestedCategoryDraft[]`, `usedDefaults: {name, count}[]`, `onChange(index, draft)`, `errors` |

```ts
type SuggestedCategoryDraft = {
  name: string;
  group: CategoryGroup;
  subGroup: CategorySubGroup;
  icon: string; // CATEGORY_ICON_MAP 키
  /** 이 카테고리로 분류된 내역 수 */
  entryCount: number;
  /** 체크(포함) 여부 */
  included: boolean;
  /** 모델이 처음 제안한 이름 — 내역의 category와 매칭하는 키 */
  originalName: string;
};
```

---

## 기술 명세

### 데이터

- 저장은 모두 기존 서비스 재사용: `initDefaultCategories`, `addCategory`, `addEntries`.
- 커플 생성 시점(`createCouple`)에 기본 카테고리를 먼저 만든다(`04-auth-flow.md`). 따라서 이 페이지에 도착했을 때 보통 카테고리는 이미 있다. 1번 단계의 `initDefaultCategories`는 구버전 커플(카테고리 0개)을 위한 보조 가드다.

### 상태

```ts
type ImportStep = 'upload' | 'categories' | 'entries';
```

- 파싱 결과(`entries`, `suggestedCategories`)와 사용자가 고친 `drafts`는 페이지 로컬 state. 새로고침하면 처음부터.

---

## E2E 테스트 시나리오 (`cashbook-import.spec.ts`, AI 목 사용)

| 시나리오                                      | 검증 항목                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| 온보딩에서 시작하기                           | `/inner/cashbook/import?onboarding=1`로 이동, 건너뛰기 → 대시보드      |
| 통장/카드 선택                                | 선택값이 요청의 `imageKind`로 간다(목: 통장이면 송금 1건 포함)         |
| 텍스트 붙여넣기 → 분석                        | 2단계로 이동, 제안 카테고리 카드가 보이고 기본 체크                    |
| 제안 카테고리 이름 수정·구분 변경 → 내역 확인 | 3단계 미리보기에 N건, 수정한 이름으로 표시                             |
| N건 추가                                      | 대시보드로 이동, 카테고리 설정에 새 카테고리가 생겼고 내역 수가 맞다   |
| 지난달 날짜 내역 저장                         | 대시보드가 그 달(`?at=`)로 열린다                                      |
| 제안 체크 해제                                | 해당 내역이 `기타`로 저장된다                                          |
| 빈 대시보드 CTA                               | "지난달 내역 불러오기" → `/inner/cashbook/import`, 뒤로가기 → 대시보드 |

---

## 관련 문서

- AI 파싱 옵션(`allowNewCategories`): `pages/05-ai-features.md` 기능 1
- 온보딩 진입: `pages/01-onboarding.md`
- 카테고리 체계: `pages/inner/cashbook-categories.md`
