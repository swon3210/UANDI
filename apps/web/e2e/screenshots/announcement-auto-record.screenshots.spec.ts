import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  clearEmulatorData,
  createTestUser,
  seedCashbookCategory,
  seedCoupleWithTwoMembers,
  seedUserDocument,
} from '../helpers/emulator';

// 공지 「고정 지출 자동 기록」(2026-11-recurring-auto-record)용 설명 스크린샷.
// 카테고리 편집 시트의 정기 발생 섹션(자동 기록 토글·기록자 칩)을 에뮬레이터 데모 데이터로 찍는다.
//
// 실행:  cd apps/web && pnpm exec playwright test --config playwright.screenshots.config.ts \
//          e2e/screenshots/announcement-auto-record.screenshots.spec.ts
//        (먼저 `pnpm emulators` 로 에뮬레이터 기동 필요)
// 결과:  apps/web/public/announcements/recurring-auto-record.png (CSS 2x로 축소)

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';
const OUT_DIR = join(__dirname, '../../public/announcements');
const OUT_FILE = join(OUT_DIR, 'recurring-auto-record.png');
/** 표시 폭(CSS 412px) × 2 — 공지 시트는 최대 448px 폭이라 2x면 충분하다. */
const OUTPUT_SCALE = 2;

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
  nextjs-portal, [data-next-badge-root], [data-nextjs-toast], #__next-build-watcher,
  [data-sonner-toaster] {
    display: none !important;
  }
`;

test('공지 스크린샷: 고정 지출 자동 기록 설정', async ({ page, context }) => {
  test.setTimeout(300_000);
  mkdirSync(OUT_DIR, { recursive: true });

  // 1) 데모 커플 + 월세 카테고리(자동 기록 on, 기록자 = 지수)
  await clearEmulatorData();
  await context.clearCookies();
  const uid1 = await createTestUser(EMAIL_1, PASSWORD);
  const uid2 = await createTestUser(EMAIL_2, PASSWORD);
  const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
  await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
  await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });
  await seedCashbookCategory(coupleId, {
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '월세',
    icon: 'house',
    color: '#D8635A',
    recurrence: {
      enabled: true,
      kind: 'dayOfMonth',
      dayOfMonth: 25,
      expectedAmount: 800000,
      autoRecord: true,
      payerUid: uid1,
    },
  });
  await seedCashbookCategory(coupleId, {
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '보험',
    icon: 'shield_check',
    sortOrder: 1,
  });

  // 2) 로그인(투어는 본 것으로) → 카테고리 페이지 → 월세 편집 시트
  await context.addInitScript(() => {
    window.localStorage.setItem('moa:tour:v1', 'true');
  });
  await page.goto('/');
  await signIn(page, EMAIL_1, PASSWORD);
  await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 15000 });

  // 시트 안에서 정기 발생 섹션이 한 화면에 들어오도록 세로를 넉넉히 잡는다.
  await page.setViewportSize({ width: 412, height: 1100 });
  await page.goto('/inner/cashbook/categories');
  await page.addStyleTag({ content: HIDE_DEV_CHROME });
  await page.getByRole('tab', { name: '지출' }).click();
  await page.getByTestId('category-item-월세-menu').click();
  await page.getByRole('menuitem', { name: '편집' }).click();

  const section = page.getByTestId('recurrence-section');
  await section.waitFor();
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600); // 시트 열림 애니메이션

  // 3) 정기 발생 섹션만 여백을 두고 잘라 찍는다 → 2x로 축소 저장
  const box = await section.boundingBox();
  if (!box) throw new Error('recurrence-section을 찾지 못했습니다');
  const pad = 16;
  const raw = await page.screenshot({
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    },
  });
  const scale = await sharp(raw).metadata();
  const dpr = 3; // playwright.screenshots.config.ts deviceScaleFactor
  const width = Math.round(((scale.width ?? 0) / dpr) * OUTPUT_SCALE);
  const out = await sharp(raw).resize({ width }).png({ compressionLevel: 9 }).toBuffer();
  const meta = await sharp(out).metadata();
  await sharp(out).toFile(OUT_FILE);
  console.log(`saved ${OUT_FILE} ${meta.width}x${meta.height}`);
});
