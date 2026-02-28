# 디자인 시스템

## 개요

디자인 시스템은 **shadcn/ui**를 기반으로 `packages/ui` 패키지(`@uandi/ui`)에 구성됩니다.
shadcn은 컴포넌트 소스를 직접 소유하므로, 브랜드에 맞게 자유롭게 커스텀할 수 있습니다.

- **shadcn 컴포넌트**: Radix UI 프리미티브 위에 구축된 접근성 보장 컴포넌트
- **커스텀 컴포넌트**: 프로젝트 전용 컴포넌트 (`packages/ui/src/custom/`)
- **스타일 방식**: TailwindCSS v4 + CSS 변수 (shadcn 표준 방식)

---

## 브랜드 방향

- **무드**: 따뜻하고 감성적이지만 과하지 않게. 미니멀하고 모던한 느낌.
- **키워드**: 포근함 / 신뢰 / 프라이빗 / 깔끔함

| 키워드       | 디자인 표현                                              |
| ------------ | -------------------------------------------------------- |
| **포근함**   | 코랄 계열 브랜드 컬러, 워밍 베이지 뉴트럴, 둥근 모서리   |
| **신뢰**     | 일관된 시각 언어, 명확한 위계, 세이지 그린의 긍정적 신호 |
| **프라이빗** | 절제된 컬러, 과도한 장식 배제, 프리미엄한 여백           |
| **깔끔함**   | 4px 그리드 기반 스페이싱, 명확한 컬러 역할 분리          |

---

## 컬러 팔레트

### 팔레트 구조

| 팔레트    | 역할                 | 핵심 키워드      |
| --------- | -------------------- | ---------------- |
| **Coral** | 브랜드 / Primary     | 포근함, 감성     |
| **Stone** | 뉴트럴 (워밍 그레이) | 깔끔함, 프라이빗 |
| **Sage**  | 수입 / 긍정          | 신뢰, 안정       |

> 순수 회색(Gray) 대신 온기가 도는 **Stone**을 사용해 차갑지 않은 깔끔함을 표현합니다.

---

### Coral — 브랜드 / 포근함

| 스케일      | HSL               | Hex       | 용도                          |
| ----------- | ----------------- | --------- | ----------------------------- |
| `coral-50`  | `hsl(4 100% 97%)` | `#FEF3F2` | 배경 틴트, Hover 상태 배경    |
| `coral-100` | `hsl(4 90% 93%)`  | `#FDDAD8` | 서브 강조 배경                |
| `coral-200` | `hsl(4 82% 85%)`  | `#F9B2AC` | 라이트 강조                   |
| `coral-300` | `hsl(4 77% 77%)`  | `#F29290` | 미디엄 강조                   |
| `coral-400` | `hsl(4 74% 69%)`  | `#E8837A` | **Primary** — 기본 버튼, 링크 |
| `coral-500` | `hsl(4 65% 58%)`  | `#D8635A` | **Expense** — 지출 금액       |
| `coral-600` | `hsl(4 60% 46%)`  | `#BE4B44` | Pressed 상태                  |
| `coral-700` | `hsl(4 56% 35%)`  | `#923832` | 강한 강조                     |
| `coral-800` | `hsl(4 52% 22%)`  | `#5E2320` | 다크 강조                     |
| `coral-900` | `hsl(4 48% 13%)`  | `#381413` | 극강 다크                     |

---

### Stone — 워밍 뉴트럴 / 깔끔함

> 순수 그레이(`hsl(0 0% x%)`)와 달리 **30° 황금빛 언더톤**을 가지고 있어 따뜻한 느낌을 유지합니다.

| 스케일      | HSL               | Hex       | 용도                                     |
| ----------- | ----------------- | --------- | ---------------------------------------- |
| `stone-50`  | `hsl(30 20% 98%)` | `#FAFAF8` | **Background** — 페이지 배경             |
| `stone-100` | `hsl(30 18% 95%)` | `#F3F1ED` | **Secondary** — 서브 컨테이너            |
| `stone-200` | `hsl(30 15% 90%)` | `#E9E4DF` | **Border** — 구분선, 입력 테두리         |
| `stone-300` | `hsl(30 12% 82%)` | `#D5CFCA` | 비활성 테두리                            |
| `stone-400` | `hsl(30 10% 68%)` | `#B4AEA8` | 플레이스홀더 텍스트                      |
| `stone-500` | `hsl(28  9% 54%)` | `#908B85` | 보조 아이콘                              |
| `stone-600` | `hsl(25  8% 42%)` | `#706C67` | **Muted Foreground** — 날짜, 설명 텍스트 |
| `stone-700` | `hsl(22  7% 30%)` | `#504C47` | 서브 텍스트                              |
| `stone-800` | `hsl(20  6% 18%)` | `#302D2A` | 강한 텍스트                              |
| `stone-900` | `hsl(20  6% 10%)` | `#1C1917` | **Foreground** — 기본 텍스트             |

---

### Sage — 수입 / 긍정 / 신뢰

| 스케일     | HSL                | Hex       | 용도                   |
| ---------- | ------------------ | --------- | ---------------------- |
| `sage-50`  | `hsl(155 60% 96%)` | `#ECFAF5` | 수입 배경 틴트         |
| `sage-100` | `hsl(155 52% 89%)` | `#CDF0DF` | 수입 항목 배경         |
| `sage-200` | `hsl(155 46% 77%)` | `#98D9BF` | 라이트 강조            |
| `sage-300` | `hsl(155 44% 63%)` | `#63C39F` | 미디엄 강조            |
| `sage-400` | `hsl(155 43% 49%)` | `#4CAF86` | **Income** — 수입 금액 |
| `sage-500` | `hsl(155 44% 37%)` | `#368869` | Pressed / 짙은 강조    |
| `sage-600` | `hsl(155 45% 27%)` | `#27644D` | 다크 강조              |
| `sage-700` | `hsl(155 46% 18%)` | `#1A4333` | 극강 다크              |

---

### 시맨틱 토큰 (shadcn 호환)

실제 컴포넌트에서는 스케일 값 직접 참조보다 **시맨틱 토큰**을 우선 사용합니다.

| CSS 변수               | 값 (스케일 참조) | Tailwind 클래스               | 용도                  |
| ---------------------- | ---------------- | ----------------------------- | --------------------- |
| `--background`         | stone-50         | `bg-background`               | 페이지 배경           |
| `--foreground`         | stone-900        | `text-foreground`             | 기본 텍스트           |
| `--card`               | white            | `bg-card`                     | 카드/컨테이너 배경    |
| `--primary`            | coral-400        | `bg-primary` / `text-primary` | CTA 버튼, 강조        |
| `--primary-foreground` | white            | `text-primary-foreground`     | Primary 위 텍스트     |
| `--secondary`          | stone-100        | `bg-secondary`                | 보조 버튼, 서브 배경  |
| `--muted`              | stone-100        | `bg-muted`                    | 비활성 배경           |
| `--muted-foreground`   | stone-600        | `text-muted-foreground`       | 날짜, 보조 정보       |
| `--accent`             | coral-50         | `bg-accent`                   | hover, 선택 상태 배경 |
| `--border`             | stone-200        | `border-border`               | 구분선, 테두리        |
| `--destructive`        | red-600          | `text-destructive`            | 삭제, 에러            |
| `--income`             | sage-400         | `text-income`                 | 수입 금액             |
| `--expense`            | coral-500        | `text-expense`                | 지출 금액             |

```tsx
/* 컴포넌트 사용 예 */
<p className="text-income">+150,000원</p>    {/* sage-400 */}
<p className="text-expense">-42,000원</p>    {/* coral-500 */}
<p className="text-muted-foreground">3월 1일</p>
```

---

## CSS 변수 전체 정의

`packages/ui/src/globals.css`

```css
@import 'tailwindcss';

@theme {
  /* Coral — 브랜드 / 포근함 */
  --color-coral-50: hsl(4 100% 97%);
  --color-coral-100: hsl(4 90% 93%);
  --color-coral-200: hsl(4 82% 85%);
  --color-coral-300: hsl(4 77% 77%);
  --color-coral-400: hsl(4 74% 69%); /* = --primary (#E8837A) */
  --color-coral-500: hsl(4 65% 58%); /* = --expense (#D8635A) */
  --color-coral-600: hsl(4 60% 46%);
  --color-coral-700: hsl(4 56% 35%);
  --color-coral-800: hsl(4 52% 22%);
  --color-coral-900: hsl(4 48% 13%);

  /* Stone — 워밍 뉴트럴 / 깔끔함 */
  --color-stone-50: hsl(30 20% 98%); /* = --background */
  --color-stone-100: hsl(30 18% 95%);
  --color-stone-200: hsl(30 15% 90%); /* = --border */
  --color-stone-300: hsl(30 12% 82%);
  --color-stone-400: hsl(30 10% 68%);
  --color-stone-500: hsl(28 9% 54%);
  --color-stone-600: hsl(25 8% 42%); /* = --muted-foreground */
  --color-stone-700: hsl(22 7% 30%);
  --color-stone-800: hsl(20 6% 18%);
  --color-stone-900: hsl(20 6% 10%); /* = --foreground (#1C1917) */

  /* Sage — 수입 / 긍정 / 신뢰 */
  --color-sage-50: hsl(155 60% 96%);
  --color-sage-100: hsl(155 52% 89%);
  --color-sage-200: hsl(155 46% 77%);
  --color-sage-300: hsl(155 44% 63%);
  --color-sage-400: hsl(155 43% 49%); /* = --income (#4CAF86) */
  --color-sage-500: hsl(155 44% 37%);
  --color-sage-600: hsl(155 45% 27%);
  --color-sage-700: hsl(155 46% 18%);

  /* 엘리베이션 */
  --shadow-sm: 0 1px 2px 0 hsl(20 6% 10% / 0.05);
  --shadow-md: 0 2px 8px 0 hsl(20 6% 10% / 0.08);
  --shadow-lg: 0 4px 16px 0 hsl(20 6% 10% / 0.1);
  --shadow-xl: 0 8px 32px 0 hsl(20 6% 10% / 0.12);
}

@theme inline {
  /* shadcn 시맨틱 토큰 */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-income: var(--income);
  --color-expense: var(--expense);

  --font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;

  --radius-sm: calc(var(--radius) - 4px); /*  8px */
  --radius-md: calc(var(--radius) - 2px); /* 10px */
  --radius-lg: var(--radius); /* 12px */
  --radius-xl: calc(var(--radius) + 4px); /* 16px */
  --radius-2xl: calc(var(--radius) + 8px); /* 20px */
}

:root {
  --background: 30 20% 98%; /* stone-50  ≈ #FAFAF8 */
  --foreground: 20 6% 10%; /* stone-900 = #1C1917 */

  --card: 0 0% 100%;
  --card-foreground: 20 6% 10%;

  --primary: 4 74% 69%; /* coral-400 = #E8837A */
  --primary-foreground: 0 0% 100%;

  --secondary: 30 18% 95%;
  --secondary-foreground: 20 6% 10%;

  --muted: 30 15% 94%;
  --muted-foreground: 25 8% 42%; /* stone-600 */

  --accent: 4 100% 95%;
  --accent-foreground: 4 60% 38%;

  --destructive: 0 72% 51%; /* #DC2626 */

  --border: 30 15% 90%;
  --input: 30 15% 90%;
  --ring: 4 74% 69%;

  --radius: 0.75rem; /* 12px */

  --income: 155 43% 49%; /* sage-400  = #4CAF86 */
  --expense: 4 65% 58%; /* coral-500 = #D8635A */

  /* 레이아웃 상수 */
  --header-h: 3.5rem; /* 56px */
  --bottom-nav-h: 4rem; /* 64px */
  --page-max-w: 28rem; /* 448px */
  --page-px: 1rem; /* 16px */
}
```

---

## 스페이싱 시스템

**4px 기준 그리드**를 사용합니다. TailwindCSS의 기본 스케일(`1 unit = 4px`)을 그대로 활용합니다.

### 컴포넌트 레벨 스페이싱

| 역할               | 값   | Tailwind        | 사용 예                      |
| ------------------ | ---- | --------------- | ---------------------------- |
| XS — 미세 간격     | 4px  | `gap-1`         | 아이콘 + 라벨 사이           |
| SM — 컴포넌트 내부 | 8px  | `gap-2` / `p-2` | 입력 필드 내부, 뱃지 패딩    |
| MD — 요소 간       | 12px | `gap-3`         | 리스트 아이템 간격           |
| LG — 카드 내부     | 16px | `gap-4` / `p-4` | 카드 내부 패딩, 폼 필드 간격 |
| XL — 그룹 간       | 24px | `gap-6`         | 관련 요소 그룹 간격          |

### 레이아웃 레벨 스페이싱

| 역할             | 값   | Tailwind    | 사용 예                 |
| ---------------- | ---- | ----------- | ----------------------- |
| 페이지 수평 패딩 | 16px | `px-4`      | 모든 페이지 좌우 여백   |
| 카드 패딩        | 16px | `p-4`       | 카드/컨테이너 내부 패딩 |
| 섹션 간격        | 24px | `space-y-6` | 페이지 내 섹션 사이     |
| 주요 구조 간격   | 32px | `gap-8`     | 헤더 ~ 컨텐츠 등        |
| 페이지 상단 여백 | 48px | `pt-12`     | 섹션 시작 상단 여백     |

### 레이아웃 상수

| 항목             | 값    | CSS 변수         | Tailwind   |
| ---------------- | ----- | ---------------- | ---------- |
| 페이지 최대 너비 | 448px | `--page-max-w`   | `max-w-md` |
| 헤더 높이        | 56px  | `--header-h`     | `h-14`     |
| 하단 네비 높이   | 64px  | `--bottom-nav-h` | `h-16`     |
| 페이지 수평 패딩 | 16px  | `--page-px`      | `px-4`     |

```tsx
/* 모든 페이지의 기본 레이아웃 */
<main className="max-w-md mx-auto px-4 pb-16">
  {/* pb-16: bottom nav 높이만큼 하단 여백 확보 */}
</main>
```

---

## 타이포그래피

폰트: **Pretendard Variable** (시스템 폰트 대체: -apple-system)

| 역할      | 클래스 조합                                   | 크기 / 행간 | 용도                 |
| --------- | --------------------------------------------- | ----------- | -------------------- |
| Display   | `text-2xl font-bold leading-tight`            | 24px / 1.3  | 페이지 타이틀        |
| Title     | `text-xl font-semibold leading-snug`          | 20px / 1.4  | 섹션 제목, 카드 헤딩 |
| Subtitle  | `text-lg font-medium`                         | 18px / 1.5  | 서브 제목, 강조 본문 |
| Body      | `text-base font-normal`                       | 16px / 1.6  | 기본 본문            |
| Secondary | `text-sm text-muted-foreground`               | 14px / 1.5  | 설명, 보조 정보      |
| Caption   | `text-xs text-muted-foreground`               | 12px / 1.4  | 날짜, 메타 정보      |
| Label     | `text-xs font-medium tracking-wide uppercase` | 12px / 1.4  | 카테고리 태그        |

### 금액 표시

가계부 금액은 숫자 시인성을 위해 `tabular-nums`를 사용합니다.

```tsx
<span className="text-lg font-semibold tabular-nums text-income">+150,000원</span>
<span className="text-lg font-semibold tabular-nums text-expense">-42,000원</span>
```

---

## 엘리베이션 (Shadow)

| 레벨 | CSS 변수      | Tailwind    | 용도                  |
| ---- | ------------- | ----------- | --------------------- |
| SM   | `--shadow-sm` | `shadow-sm` | 카드 미세 부각        |
| MD   | `--shadow-md` | `shadow-md` | 카드, 드롭다운        |
| LG   | `--shadow-lg` | `shadow-lg` | Floating 버튼, 팝오버 |
| XL   | `--shadow-xl` | `shadow-xl` | 바텀 시트, 모달       |

> 컬러 위주 디자인 특성상 그림자는 **최소화**합니다.
> 대부분의 카드는 `border border-border`만으로 구분하고, 그림자는 오버레이 UI에만 사용합니다.

---

## 보더 라디우스

| 변수            | 값     | Tailwind         | 용도                  |
| --------------- | ------ | ---------------- | --------------------- |
| `--radius-sm`   | 8px    | `rounded-lg`     | 뱃지, 태그, 작은 칩   |
| `--radius-md`   | 10px   | `rounded-[10px]` | 버튼, 입력 필드       |
| `--radius-lg`   | 12px   | `rounded-xl`     | 카드, 컨테이너 (기본) |
| `--radius-xl`   | 16px   | `rounded-2xl`    | 모달, 다이얼로그      |
| `--radius-2xl`  | 20px   | `rounded-[20px]` | 바텀 시트 상단 모서리 |
| `--radius-full` | 9999px | `rounded-full`   | 아바타, 토글, 필 버튼 |

```tsx
/* 바텀 시트 상단 모서리 패턴 */
<SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh]">
```

---

## 컴포넌트 카탈로그

### shadcn 컴포넌트 (CLI로 설치, `packages/ui/src/components/`)

| 컴포넌트    | 용도                    |
| ----------- | ----------------------- |
| `Button`    | 모든 버튼 액션          |
| `Input`     | 텍스트 입력             |
| `Form`      | React Hook Form 연동 폼 |
| `Dialog`    | 데스크탑 모달           |
| `Sheet`     | 모바일 Bottom Sheet     |
| `Skeleton`  | 로딩 플레이스홀더       |
| `Tabs`      | 지출/수입 탭 전환       |
| `Badge`     | 카테고리 칩, 상태 표시  |
| `Avatar`    | 사용자 프로필 이미지    |
| `Sonner`    | 토스트 알림             |
| `Separator` | 날짜 그룹 구분선        |

> **바텀 시트 / 모달 / 스낵바**를 열어야 할 경우 → shadcn 컴포넌트를 직접 쓰지 않고
> **overlay-kit**의 `overlay.open()` / `overlay.openAsync()`를 사용합니다. (`docs/01-tech-stack.md` 참고)

### 커스텀 컴포넌트 (`packages/ui/src/custom/`)

| 컴포넌트     | Props                                     | 용도            |
| ------------ | ----------------------------------------- | --------------- |
| `Header`     | `title`, `leftSlot?`, `rightSlot?`        | 페이지 헤더     |
| `BottomNav`  | `activeTab`                               | 하단 네비게이션 |
| `EmptyState` | `icon`, `title`, `description`, `action?` | 빈 상태 화면    |

---

## 폼 패턴 (React Hook Form + shadcn)

모든 폼은 아래 패턴을 따릅니다. 직접 `<input>`을 쓰지 않습니다.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@uandi/ui';
import { Input, Button } from '@uandi/ui';

const schema = z.object({
  amount: z.number().positive('금액을 입력해주세요'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function LedgerEntryForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, description: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>금액</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">저장</Button>
      </form>
    </Form>
  );
}
```

---

## Button Variant 매핑

| 용도        | shadcn variant | 예시                         |
| ----------- | -------------- | ---------------------------- |
| 주요 CTA    | `default`      | "업로드", "저장", "연결하기" |
| 보조 액션   | `outline`      | "취소", "뒤로"               |
| 텍스트 버튼 | `ghost`        | "전체 보기"                  |
| 삭제/위험   | `destructive`  | "삭제"                       |

---

## 아이콘

- **라이브러리**: `lucide-react`
- **기본 크기**: `size={20}` (인라인), `size={24}` (단독)
- **컬러**: 부모 컨텍스트 color 상속 (`currentColor`)

---

## 반응형 전략

이 서비스는 **모바일 퍼스트**입니다.

- 기본 레이아웃은 `max-w-md` 단일 컬럼
- 태블릿/데스크탑 (`md:` 이상)에서는 사이드바 또는 2열 그리드로 전환 가능
- `BottomNav`는 모바일에서만 표시 (`md:hidden`)
- 데스크탑에서는 Left Sidebar로 전환 (`hidden md:flex`)

---

## 컴포넌트 추가 결정 기준

| 경우                            | 방법                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| shadcn에 있는 컴포넌트          | `pnpm dlx shadcn@latest add [name]` (packages/ui에서 실행) |
| 프로젝트 전용 조합 컴포넌트     | `packages/ui/src/custom/`에 직접 작성                      |
| 특정 페이지에서만 쓰는 컴포넌트 | `apps/web/src/components/[도메인]/`에 작성                 |
