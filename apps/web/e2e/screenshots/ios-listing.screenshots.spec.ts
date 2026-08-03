import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  clearEmulatorData,
  createTestUser,
  seedUserDocument,
  seedCoupleWithTwoMembers,
} from '../helpers/emulator';
import { seedDemoData } from './seed-demo';

// App Store(iOS) 전용 스크린샷. iOS 앱은 가계부 외 기능(사진첩/재테크/커뮤니티)을 숨기므로,
// 가계부 화면만 phoneScreenshots.ios/ 에 캡처한다. (appstore-screenshots.mjs 가 이 폴더를 우선
// 읽어 1290×2796 로 리사이즈+패딩 후 App Store 에 업로드한다.)
//
// 실행:  pnpm emulators  (먼저)  →  pnpm --filter web exec playwright test \
//          --config playwright.screenshots.config.ts ios-listing.screenshots.spec.ts

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';

const IMAGES_DIR = join(__dirname, '../../../mobile/store/listings/ko-KR/images');
const OUT_DIR = 'phoneScreenshots.ios';

// iOS 노출 화면 = 가계부만. 파일명 앞 숫자가 노출 순서.
type Screen = { path: string; file: string; label: string; waitFor?: string };
const SCREENS: Screen[] = [
  { path: '/inner', file: '1-dashboard', label: '대시보드', waitFor: '[data-testid="dashboard-header"]' },
  { path: '/inner/cashbook/history', file: '2-cashbook', label: '가계부 내역' },
  { path: '/inner/cashbook/cashflow', file: '3-cashflow', label: '현금흐름 캘린더' },
];

async function signIn(page: Page, email: string, password: string) {
  await page.waitForFunction(
    () => typeof (window as any).__signInWithEmailAndPassword === 'function',
    { timeout: 10000 }
  );
  await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      await w.__signInWithEmailAndPassword(w.__auth, email, password);
    },
    { email, password }
  );
}

const HIDE_DEV_CHROME = `
  nextjs-portal, [data-next-badge-root], [data-nextjs-toast], #__next-build-watcher {
    display: none !important;
  }
`;

test('App Store(iOS) 가계부 스크린샷 캡처', async ({ page, context }) => {
  test.setTimeout(600_000);
  mkdirSync(join(IMAGES_DIR, OUT_DIR), { recursive: true });

  await clearEmulatorData();
  await context.clearCookies();
  const uid1 = await createTestUser(EMAIL_1, PASSWORD);
  const uid2 = await createTestUser(EMAIL_2, PASSWORD);
  const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
  await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
  await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });
  await seedDemoData(coupleId, uid1, uid2);

  for (const s of SCREENS) {
    await page.request
      .get(s.path, { headers: { cookie: 'uandi-auth=with_couple' }, timeout: 90_000 })
      .catch(() => {});
  }

  await page.goto('/');
  await signIn(page, EMAIL_1, PASSWORD);
  await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 15000 });

  console.log(`\niOS 스크린샷 저장 위치: ${join(IMAGES_DIR, OUT_DIR)}\n`);
  for (const s of SCREENS) {
    await page.goto(s.path, { waitUntil: 'domcontentloaded' });
    if (s.waitFor) await page.waitForSelector(s.waitFor, { timeout: 15000 }).catch(() => {});
    await page.addStyleTag({ content: HIDE_DEV_CHROME }).catch(() => {});
    await page.waitForTimeout(2500);
    const out = join(IMAGES_DIR, OUT_DIR, `${s.file}.png`);
    await page.screenshot({ path: out, animations: 'disabled' });
    console.log(`  ✓ ${s.label} → ${OUT_DIR}/${s.file}.png`);
  }

  console.log(`\n완료. \`node scripts/appstore-screenshots.mjs push\` 로 업로드하세요.\n`);
});
