# 페이지 명세: 가계부 (/cashbook)

## 목적

커플의 수입과 지출을 함께 기록하고 월별로 관리하는 기능.

> **가계부 기능 문서 구성**
>
> | 파일 | 내용 |
> |------|------|
> | `04-cashbook.md` | 내역 CRUD + 메인 화면 (이 문서) |
> | `04a-cashbook-categories.md` | 카테고리 체계 + 관리 대시보드 |
> | `04b-cashbook-annual-plan.md` | 연간 예산 계획 |
> | `04c-cashbook-monthly.md` | 월간 대시보드 (목표 vs 실제) |
> | `04d-cashbook-weekly.md` | 주간 예산 & 지출 추적 |

---

## 사용자 스토리

- 커플로서, 이번 달에 얼마나 썼는지 한눈에 보고 싶다.
- 커플로서, 새로운 지출/수입 내역을 빠르게 추가하고 싶다.
- 커플로서, 과거 달의 내역도 돌아볼 수 있어야 한다.

---

## UI 구성

### 메인 화면

```
┌─────────────────────────┐
│  가계부              [+] │  ← Header + 추가 버튼
├─────────────────────────┤
│                         │
│  ← 2024년 1월 →         │  ← 월 이동 컨트롤
│                         │
│  ┌───────────────────┐  │
│  │  수입   +500,000   │  │
│  │  지출   -230,000   │  │  ← 월별 요약 카드
│  │  잔액    270,000   │  │
│  └───────────────────┘  │
│                         │
│  1월 15일                │  ← 날짜 그룹 헤더
│  ┌───────────────────┐  │
│  │ 🛒 식비  -45,000  │  │  ← 항목 카드
│  │    마트 장보기     │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 💰 월급 +3,000,000│  │
│  └───────────────────┘  │
│                         │
│  1월 12일                │
│  ...                    │
│                         │
│         (Empty State)   │  ← 내역 없을 때
│         📒              │
│         아직 내역이 없어요│
│         [추가하기]       │
│                         │
├─────────────────────────┤
│  [홈] [사진] [가계부]   │
└─────────────────────────┘
```

### 항목 추가 — Bottom Sheet

[+] 버튼 클릭 시 하단에서 Bottom Sheet 등장

```
┌─────────────────────────┐
│  내역 추가               │
│                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 지출 │ │ 수입 │ │재테크│ │ Flex │ │  ← 탭 (기본: 지출)
│  └──────┘ └──────┘ └──────┘ └──────┘ │
│                         │
│  금액                   │
│  ┌───────────────────┐  │
│  │  0                │  │  ← 숫자 입력 (우측 정렬, 큰 폰트)
│  └───────────────────┘  │  ← 포커스 시 숫자 키패드
│                         │
│  카테고리               │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │식│ │교│ │쇼│ │의│  │  ← 프리셋 칩 (가로 스크롤)
│  └──┘ └──┘ └──┘ └──┘  │
│  [직접 입력]            │  ← 프리셋 외 입력
│                         │
│  날짜                   │
│  ┌───────────────────┐  │
│  │  2024-01-15       │  │  ← date input (기본값: 오늘)
│  └───────────────────┘  │
│                         │
│  메모 (선택)             │
│  ┌───────────────────┐  │
│  │                   │  │  ← 한 줄 input
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  저장              │  │  ← primary, 금액 > 0이면 활성화
│  └───────────────────┘  │
└─────────────────────────┘
```

### 항목 상세 / 수정

- 항목 카드 클릭 → Bottom Sheet를 수정 모드로 열기
- 기존 값 미리 채워진 상태
- "삭제" 버튼 추가 (확인 없이 즉시 삭제 후 Sheet 닫힘)

---

## 기술 명세

### 데이터 페칭

```ts
// 선택된 월의 모든 항목
const startOfMonth = Timestamp.fromDate(startOfMonth(selectedDate));
const endOfMonth = Timestamp.fromDate(endOfMonth(selectedDate));

query(
  collection(db, `couples/${coupleId}/cashbookEntries`),
  where('date', '>=', startOfMonth),
  where('date', '<=', endOfMonth),
  orderBy('date', 'desc')
);
```

### 월별 요약 계산 (클라이언트)

```ts
const totalIncome = entries
  .filter((e) => e.type === 'income')
  .reduce((sum, e) => sum + e.amount, 0);
const totalExpense = entries
  .filter((e) => e.type === 'expense')
  .reduce((sum, e) => sum + e.amount, 0);
const balance = totalIncome - totalExpense;
```

### 날짜별 그룹핑

```ts
// dayjs로 날짜별로 entries를 그룹핑 (dayjs(a).isSame(b, 'day'))
type GroupedEntries = {
  date: Date;
  entries: CashbookEntry[];
}[];
```

### 금액 포맷 (`utils/currency.ts`)

```ts
// 양수: "+1,234,000원"  |  음수: "-45,000원"
formatAmount(amount: number, type: 'income' | 'expense'): string
// 일반: "1,234,000원"
formatCurrency(amount: number): string
```

### 월 이동 컨트롤

- `← 2024년 1월 →` 형태
- 좌우 화살표 클릭으로 이전/다음 달 이동
- 미래 달은 이동 불가 (오늘 달이 최대)
- 상태: `useState<Date>(new Date())` — 해당 달의 임의 날짜

### CRUD 작업

| 작업 | Firebase 메서드               | TanStack Query        |
| ---- | ----------------------------- | --------------------- |
| 조회 | `getDocs` (또는 `onSnapshot`) | `useQuery`            |
| 추가 | `addDoc`                      | mutation + invalidate |
| 수정 | `updateDoc`                   | mutation + invalidate |
| 삭제 | `deleteDoc`                   | mutation + invalidate |

> `onSnapshot`을 사용하면 상대방이 추가한 내역이 실시간으로 반영됩니다.
> MVP에서는 `getDocs` + invalidate 방식도 허용.

### 카테고리 칩 UX

- 카테고리 프리셋은 `03-domain-models.md`의 `EXPENSE_CATEGORIES` / `INCOME_CATEGORIES` 참고
- type 탭 전환 시 카테고리 목록도 변경됨
- 선택된 카테고리는 `bg-primary text-white`
- "직접 입력" 선택 시 text input 표시

---

## 관련 문서

- CashbookEntry 타입 및 카테고리 프리셋: `03-domain-models.md`
- 디자인 원칙 (Bottom Sheet, 금액 색상): `02-design-system.md`
- 카테고리 체계 및 관리: `04a-cashbook-categories.md`
- 연간 예산 계획: `04b-cashbook-annual-plan.md`
- 월간 대시보드: `04c-cashbook-monthly.md`
- 주간 예산 & 지출: `04d-cashbook-weekly.md`
