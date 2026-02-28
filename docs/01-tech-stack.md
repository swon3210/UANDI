# 기술 스택

## 모노레포 구성

| 항목          | 선택                          | 이유                                    |
| ------------- | ----------------------------- | --------------------------------------- |
| 모노레포 도구 | Turborepo                     | Next.js 최적화, 빌드 캐싱               |
| 패키지 매니저 | **pnpm** (workspaces)         | 디스크 효율, workspace 프로토콜         |
| E2E 테스트    | Playwright                    | Next.js 공식 지원, 크로스 브라우저      |
| 테스트 환경   | Firebase Local Emulator Suite | 프로덕션 데이터 오염 없는 격리된 테스트 |

### 패키지 구성

| 패키지            | 경로                | 역할                      |
| ----------------- | ------------------- | ------------------------- |
| `@uandi/ui`       | `packages/ui`       | shadcn 기반 디자인 시스템 |
| `@uandi/tsconfig` | `packages/tsconfig` | 공유 TypeScript 설정      |
| `web`             | `apps/web`          | 메인 Next.js 앱           |
| `docs`            | `apps/docs`         | 문서 뷰어 Next.js 앱      |

---

## 프론트엔드

| 항목          | 선택                  | 버전   | 이유                                               |
| ------------- | --------------------- | ------ | -------------------------------------------------- |
| 프레임워크    | Next.js (App Router)  | 15.x   | SSR/SSG 지원, 파일 기반 라우팅                     |
| UI 라이브러리 | React                 | 19.x   | Next.js 기본                                       |
| 언어          | TypeScript            | 5.x    | 타입 안정성, AI 코드 생성 품질 향상                |
| 스타일        | TailwindCSS           | 4.x    | 유틸리티 클래스, CSS 변수 연동                     |
| 디자인 시스템 | shadcn/ui             | latest | Radix UI 기반, 컴포넌트 소유권                     |
| 상태 관리     | Jotai                 | v2     | atomic 전역 상태, 파생 atom 지원 (인증, 커플 정보) |
| 서버 상태     | TanStack Query        | v5     | Firebase 데이터 페칭/캐싱/무효화                   |
| 폼            | React Hook Form + Zod | —      | shadcn Form과 통합, 유효성 검사                    |
| 날짜 처리     | dayjs                 | v1     | 경량 날짜 유틸리티                                 |
| 오버레이 UI   | overlay-kit           | v1     | Modal, Bottom Sheet, Snackbar 선언적 관리          |

## 백엔드 (Firebase)

| 항목         | 선택                    | 용도                          |
| ------------ | ----------------------- | ----------------------------- |
| 인증         | Firebase Authentication | 구글 소셜 로그인              |
| 데이터베이스 | Cloud Firestore         | 가계부, 커플 정보, 메타데이터 |
| 파일 저장소  | Firebase Storage        | 사진 원본 / 썸네일            |
| 호스팅       | Vercel                  | Next.js 최적화 배포           |

---

## 모노레포 폴더 구조

```
uandi/                              # 루트
├── apps/
│   └── web/                        # Next.js 앱
│       ├── src/
│       │   ├── app/                # App Router 페이지
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx        # / (루트)
│       │   │   ├── onboarding/page.tsx
│       │   │   ├── photos/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   └── cashbook/page.tsx
│       │   ├── components/         # 앱 전용 컴포넌트 (도메인)
│       │   │   ├── photos/
│       │   │   └── cashbook/
│       │   ├── lib/
│       │   │   ├── firebase/
│       │   │   │   ├── config.ts
│       │   │   │   ├── auth.ts
│       │   │   │   ├── firestore.ts
│       │   │   │   └── storage.ts
│       │   │   └── query-client.ts
│       │   ├── services/           # 도메인 서비스 (Firestore 비즈니스 로직)
│       │   │   ├── user.ts         # createUserDocument, getUserDocument
│       │   │   ├── couple.ts       # createCouple, joinCoupleByInviteCode
│       │   │   ├── photos.ts       # addPhoto, deletePhoto
│       │   │   └── cashbook.ts     # addEntry, updateEntry, deleteEntry
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useCouple.ts
│       │   │   ├── usePhotos.ts
│       │   │   └── useCashbook.ts
│       │   ├── stores/
│       │   │   └── auth.store.ts
│       │   ├── types/
│       │   │   └── index.ts        # 도메인 타입 (03-domain-models.md)
│       │   └── utils/
│       │       ├── currency.ts
│       │       └── date.ts
│       ├── e2e/                        # Playwright E2E 테스트
│       │   ├── fixtures/               # 인증 상태 등 공통 픽스처
│       │   ├── page-objects/           # Page Object Model
│       │   │   ├── OnboardingPage.ts
│       │   │   ├── PhotosPage.ts
│       │   │   └── CashbookPage.ts
│       │   ├── specs/                  # 테스트 스펙
│       │   │   ├── onboarding.spec.ts
│       │   │   ├── photos.spec.ts
│       │   │   └── cashbook.spec.ts
│       │   └── helpers/
│       │       └── auth.ts             # 테스트용 인증 헬퍼
│       ├── .env.local
│       ├── .env.test                   # 테스트용 환경 변수 (Emulator 주소)
│       ├── playwright.config.ts
│       ├── next.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                         # @uandi/ui 디자인 시스템
│   │   ├── src/
│   │   │   ├── components/         # shadcn CLI로 추가되는 컴포넌트
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── form.tsx        # react-hook-form 연동
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── sheet.tsx       # Bottom Sheet
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   └── sonner.tsx      # 토스트 알림
│   │   │   ├── custom/             # 프로젝트 전용 커스텀 컴포넌트
│   │   │   │   ├── BottomNav.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   ├── globals.css         # CSS 변수 정의 (shadcn + 브랜드)
│   │   │   └── index.ts            # 모든 컴포넌트 re-export
│   │   ├── components.json         # shadcn CLI 설정
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── tsconfig/                   # @uandi/tsconfig
│       ├── base.json
│       ├── nextjs.json
│       └── package.json
│
├── apps/
│   └── docs/                       # 문서 뷰어 Next.js 앱
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx        # / → 첫 문서로 리다이렉트
│       │   │   └── [...slug]/
│       │   │       └── page.tsx    # 동적 라우트로 모든 문서 렌더링
│       │   ├── components/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── DocContent.tsx  # 마크다운 렌더링
│       │   │   └── TableOfContents.tsx
│       │   └── lib/
│       │       ├── docs.ts         # 마크다운 파일 읽기 & slug 변환
│       │       └── markdown.ts     # remark/rehype 파이프라인
│       ├── next.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                           # 마크다운 원본 파일 (루트)
│   ├── 00-overview.md
│   ├── ...
│   └── pages/
│
├── package.json                    # pnpm workspace 루트
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 패키지 설정 파일

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `packages/ui/components.json` (shadcn 설정)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "src/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@uandi/ui/components",
    "utils": "@uandi/ui/utils"
  }
}
```

### `packages/ui/package.json`

```json
{
  "name": "@uandi/ui",
  "version": "0.0.1",
  "exports": {
    ".": "./src/index.ts",
    "./globals.css": "./src/globals.css"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-hook-form": "latest",
    "@hookform/resolvers": "latest",
    "zod": "latest",
    "lucide-react": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

### `apps/web/package.json` 주요 의존성

```json
{
  "dependencies": {
    "@uandi/ui": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "firebase": "latest",
    "jotai": "^2.0.0",
    "overlay-kit": "^1.0.0",
    "@tanstack/react-query": "^5.0.0",
    "dayjs": "^1.0.0"
  }
}
```

---

## 상태 관리 패턴

### Jotai — 전역 클라이언트 상태

`apps/web/src/stores/` 아래에 atom 파일을 위치시킵니다.

```typescript
import { atom } from 'jotai';

// 기본 atom
export const userAtom = atom<User | null | undefined>(undefined);

// 파생(derived) atom — 읽기 전용
export const authStatusAtom = atom<AuthStatus>((get) => {
  const user = get(userAtom);
  if (user === undefined) return 'loading';
  if (user === null) return 'unauthenticated';
  return user.coupleId !== null ? 'authenticated_with_couple' : 'authenticated_no_couple';
});

// 컴포넌트에서 사용
const [user, setUser] = useAtom(userAtom);
const status = useAtomValue(authStatusAtom);
```

### overlay-kit — Modal / Bottom Sheet / Snackbar

`apps/web/src/app/layout.tsx`에서 `OverlayProvider`를 앱 루트에 추가해야 합니다.

```tsx
import { OverlayProvider } from 'overlay-kit';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OverlayProvider>{children}</OverlayProvider>
      </body>
    </html>
  );
}
```

컴포넌트에서 오버레이 열기:

```tsx
import { overlay } from 'overlay-kit';

// 비동기 확인 다이얼로그
const confirmed = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
  <Dialog
    open={isOpen}
    onConfirm={() => close(true)}
    onClose={() => close(false)}
    onExit={unmount}
  />
));

// 일반 Bottom Sheet
overlay.open(({ isOpen, close, unmount }) => (
  <Sheet open={isOpen} onClose={close} onExit={unmount} />
));
```

---

## shadcn 컴포넌트 추가 방법

새 shadcn 컴포넌트가 필요할 때는 `packages/ui` 디렉토리에서 실행합니다.

```bash
cd packages/ui
pnpm dlx shadcn@latest add [컴포넌트명]
```

추가 후 `packages/ui/src/index.ts`에서 re-export합니다.

---

## 환경 변수

`apps/web/.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 코딩 컨벤션

- **컴포넌트**: PascalCase 파일명, named export
- **shadcn 컴포넌트 파일명**: 소문자 (`button.tsx`, `input.tsx`) — shadcn CLI 기본
- **훅**: `use` 접두사, camelCase
- **타입**: `type` 선호 (interface는 확장이 필요한 경우만)
- **임포트 순서**: 1) React/Next 2) 외부 라이브러리 3) `@uandi/ui` 4) 내부 경로 (`@/`)
- **폼**: React Hook Form + Zod + shadcn `<Form>` 컴포넌트 조합으로 통일
- **에러 처리**: Firebase 에러는 각 훅 내부에서 처리, UI에는 사용자 친화적 메시지만
