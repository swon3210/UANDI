# 테스트 전략

## 핵심 원칙

**E2E 테스트 우선(Test-First) 개발**을 따릅니다.

```
페이지 명세 확인 → E2E 테스트 작성 → 테스트 실행(실패 확인) → 구현 → 테스트 통과
```

기능이 완성됐다는 기준은 "해당 기능의 E2E 테스트가 모두 통과하는 것"입니다.

---

## 테스트 도구

| 항목           | 선택                          |
| -------------- | ----------------------------- |
| E2E 프레임워크 | Playwright                    |
| 테스트 환경    | Firebase Local Emulator Suite |
| 패턴           | Page Object Model (POM)       |

---

## Firebase Local Emulator 설정

E2E 테스트는 프로덕션 Firebase가 아닌 **로컬 에뮬레이터**에 연결해서 실행합니다.

### 사용 에뮬레이터

- Authentication Emulator — `localhost:9099`
- Firestore Emulator — `localhost:8080`
- Storage Emulator — `localhost:9199`

### `apps/web/.env.test`

```env
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

# 실제 Firebase 프로젝트 값은 그대로 유지 (에뮬레이터 연결에 필요)
NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=uandi-test
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=uandi-test.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:0000000000000000
```

### `apps/web/src/lib/firebase/config.ts` 에뮬레이터 연결

```ts
if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`);
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

### 에뮬레이터 실행 명령

```bash
# firebase.json에 에뮬레이터 설정 필요
firebase emulators:start --only auth,firestore,storage
```

---

## Playwright 설정

### `apps/web/playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false, // Firebase 에뮬레이터 상태 충돌 방지
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: { ...process.env, NEXT_PUBLIC_FIREBASE_USE_EMULATOR: 'true' },
  },
});
```

---

## 폴더 구조 & 역할

```
apps/web/e2e/
├── fixtures/
│   └── auth.fixture.ts       # 인증 상태별 픽스처 (noCoupleAuthedPage, authedPage)
├── page-objects/             # Page Object Model
│   ├── OnboardingPage.ts
│   ├── PhotosPage.ts
│   └── CashbookPage.ts
├── specs/                    # 실제 테스트 파일
│   ├── onboarding.spec.ts
│   ├── photos.spec.ts
│   └── cashbook.spec.ts
└── helpers/
    └── emulator.ts           # 에뮬레이터 데이터 초기화 & 시드 헬퍼
```

---

## Page Object Model (POM) 패턴

각 페이지의 셀렉터와 액션을 캡슐화해서 테스트 스펙이 의도를 명확하게 표현하도록 합니다.

### 예시: `e2e/page-objects/CashbookPage.ts`

```ts
import { type Page, type Locator } from '@playwright/test';

export class CashbookPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly sheet: Locator;
  readonly amountInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByRole('button', { name: '추가' });
    this.sheet = page.getByRole('dialog');
    this.amountInput = page.getByLabel('금액');
    this.saveButton = page.getByRole('button', { name: '저장' });
  }

  async goto() {
    await this.page.goto('/cashbook');
  }

  async addEntry(amount: number, category: string, description?: string) {
    await this.addButton.click();
    await this.amountInput.fill(String(amount));
    await this.page.getByRole('button', { name: category }).click();
    if (description) {
      await this.page.getByLabel('메모').fill(description);
    }
    await this.saveButton.click();
  }
}
```

---

## 테스트 인증 전략

구글 소셜 로그인은 E2E 테스트에서 직접 사용할 수 없으므로, **Firebase Auth Emulator의 REST API**로 이메일/비밀번호 유저를 생성해 로그인합니다.
에뮬레이터에서는 프로덕션 설정(Google OAuth 전용)과 무관하게 이메일/비밀번호 로그인이 허용됩니다.

### 브라우저에서 로그인 가능하게 만들기

`lib/firebase/config.ts`에서 에뮬레이터 모드일 때 `auth` 인스턴스를 `window`에 노출합니다.
Playwright의 `page.evaluate`가 이 인스턴스를 통해 로그인을 실행합니다.

```ts
// lib/firebase/config.ts (에뮬레이터 연결 블록 안에 추가)
if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);

  // Playwright 테스트용: auth 인스턴스를 window에 노출
  if (typeof window !== 'undefined') {
    (window as any).__auth = auth;
  }
}
```

### `e2e/helpers/emulator.ts`

```ts
const PROJECT_ID = 'uandi-test';
const AUTH_EMULATOR = 'http://localhost:9099';
const FIRESTORE_EMULATOR = 'http://localhost:8080';

// 에뮬레이터 데이터 완전 초기화 (각 테스트 suite 전에 호출)
export async function clearEmulatorData() {
  await Promise.all([
    fetch(
      `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      { method: 'DELETE' }
    ),
    fetch(
      `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`,
      { method: 'DELETE' }
    ),
  ]);
}

// Auth Emulator REST API로 테스트 유저 생성 → uid 반환
export async function createTestUser(email: string, password: string): Promise<string> {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const { localId } = (await res.json()) as { localId: string };
  return localId;
}

// Firestore REST API로 users 문서 직접 생성
export async function seedUserDocument(
  uid: string,
  email: string,
  coupleId: string | null = null
) {
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          uid: { stringValue: uid },
          email: { stringValue: email },
          displayName: { stringValue: 'Test User' },
          photoURL: { nullValue: null },
          coupleId: coupleId ? { stringValue: coupleId } : { nullValue: null },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}

// Firestore REST API로 커플 문서 생성 → coupleId 반환
export async function seedCoupleWithTwoMembers(uid1: string, uid2: string): Promise<string> {
  const coupleId = `couple-test-${Date.now()}`;
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: coupleId },
          memberUids: {
            arrayValue: { values: [{ stringValue: uid1 }, { stringValue: uid2 }] },
          },
          inviteCode: { stringValue: 'TEST12' },
          inviteCodeExpiresAt: {
            timestampValue: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
  return coupleId;
}
```

### `e2e/fixtures/auth.fixture.ts`

```ts
import { test as base, type Page } from '@playwright/test';
import {
  clearEmulatorData,
  createTestUser,
  seedUserDocument,
  seedCoupleWithTwoMembers,
} from '../helpers/emulator';

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';

// 브라우저에서 Firebase Auth Emulator로 이메일/비밀번호 로그인
async function signInOnPage(page: Page, email: string, password: string) {
  await page.evaluate(
    async ({ email, password }) => {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      // config.ts에서 에뮬레이터 모드에 노출한 auth 인스턴스 사용
      await signInWithEmailAndPassword((window as any).__auth, email, password);
    },
    { email, password }
  );
}

type Fixtures = {
  // 로그인 O, coupleId 없음 → 온보딩 테스트용
  noCoupleAuthedPage: Page;
  // 로그인 O, coupleId 있음 → 대시보드 / 사진 / 가계부 테스트용
  authedPage: Page;
};

export const test = base.extend<Fixtures>({
  noCoupleAuthedPage: async ({ page }, use) => {
    await clearEmulatorData();
    const uid = await createTestUser(EMAIL_1, PASSWORD);
    await seedUserDocument(uid, EMAIL_1, null); // coupleId = null

    await page.goto('/');
    await signInOnPage(page, EMAIL_1, PASSWORD);
    await page.waitForURL('**/onboarding'); // middleware가 /onboarding으로 리다이렉트

    await use(page);
  },

  authedPage: async ({ page }, use) => {
    await clearEmulatorData();
    const uid1 = await createTestUser(EMAIL_1, PASSWORD);
    const uid2 = await createTestUser(EMAIL_2, PASSWORD);
    const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
    await seedUserDocument(uid1, EMAIL_1, coupleId);
    await seedUserDocument(uid2, EMAIL_2, coupleId);

    await page.goto('/');
    await signInOnPage(page, EMAIL_1, PASSWORD);
    await page.waitForURL('/'); // middleware가 / (대시보드)에 유지

    await use(page);
  },
});
```

---

## E2E 테스트 작성 기준

페이지 명세(`docs/pages/*.md`)의 **사용자 스토리**를 테스트 케이스로 1:1 변환합니다.

### 테스트 케이스 명명 규칙

```
[사용자 스토리를 동사로 시작하는 한국어 문장]

예:
✓ '지출 내역을 추가하면 목록에 표시된다'
✓ '금액을 입력하지 않으면 저장 버튼이 비활성화된다'
✓ '이번 달 지출 합계가 요약 카드에 표시된다'
✗ 'test cashbook form'  ← 나쁜 예
```

### Happy Path + Edge Case 분리

```ts
describe('가계부', () => {
  describe('내역 추가', () => {
    test('지출 내역을 추가하면 목록에 표시된다', async ({ authedPage }) => { ... });
    test('수입 내역을 추가하면 요약 카드 수입 금액이 증가한다', async ({ authedPage }) => { ... });
  });

  describe('유효성 검사', () => {
    test('금액이 0이면 저장 버튼이 비활성화된다', async ({ authedPage }) => { ... });
    test('금액에 문자를 입력하면 에러 메시지가 표시된다', async ({ authedPage }) => { ... });
  });
});
```

---

## pnpm 스크립트

### 루트 `package.json`

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test:e2e": "turbo test:e2e",
    "emulators": "firebase emulators:start --only auth,firestore,storage"
  }
}
```

### `apps/web/package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  }
}
```

### 자주 쓰는 명령어

```bash
# 에뮬레이터 실행 (별도 터미널)
pnpm emulators

# E2E 테스트 전체 실행
pnpm test:e2e

# 특정 스펙만 실행
pnpm --filter web test:e2e -- e2e/specs/cashbook.spec.ts

# Playwright UI 모드 (디버깅)
pnpm --filter web test:e2e:ui
```
