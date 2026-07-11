import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  clearEmulatorData,
  createTestUser,
  seedUserDocument,
  seedCoupleWithTwoMembers,
  seedAnnualPlan,
  seedAnnualPlanItem,
} from '../helpers/emulator';
import { seedDemoData } from './seed-demo';

// 말랑 가계부 온보딩 투어(ServiceTourOverlay)의 가계부 슬라이드용 실제 화면 스크린샷을 생성한다.
// 데모 커플 데이터 + 연간 예산을 시드한 뒤 각 화면을 캡처하고, 웹용으로 리사이즈해
// apps/web/public/tour/*.webp 로 저장한다.
//
// 실행:  pnpm emulators (먼저, --project uandi-test) → pnpm --filter web screenshots:tour

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';

const OUT_DIR = join(__dirname, '../../public/tour');

type Screen = { path: string; file: string; label: string; waitFor?: string };
const SCREENS: Screen[] = [
  {
    path: '/inner/cashbook/history',
    file: 'cashbook-record',
    label: '가계부 내역+요약',
    waitFor: '[data-testid="monthly-summary"]',
  },
  { path: '/inner/cashbook/plan/annual', file: 'cashbook-budget', label: '예산(연간계획)' },
  { path: '/inner/cashbook/cashflow', file: 'cashbook-cashflow', label: '현금흐름' },
  { path: '/inner/cashbook/review', file: 'cashbook-settlement', label: '점검' },
];

// 시드된 기본 카테고리의 이름 → 문서 ID 맵을 조회한다.
// (연간 예산 항목을 실제 카테고리에 연결해야 결산 '예산 vs 실적' 차트 라벨이 올바르게 나온다)
async function getCategoryIdsByName(coupleId: string): Promise<Record<string, string>> {
  const res = await fetch(
    `http://localhost:8080/v1/projects/uandi-test/databases/(default)/documents/couples/${coupleId}/cashbookCategories?pageSize=100`,
    { headers: { Authorization: 'Bearer owner' } }
  );
  const json = (await res.json()) as {
    documents?: { name: string; fields?: { name?: { stringValue?: string }; id?: { stringValue?: string } } }[];
  };
  const map: Record<string, string> = {};
  for (const doc of json.documents ?? []) {
    const name = doc.fields?.name?.stringValue;
    const id = doc.fields?.id?.stringValue ?? doc.name.split('/').pop();
    if (name && id) map[name] = id;
  }
  return map;
}

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

// dev 모드 표시 배지(Next.js 로고 등)는 스크린샷에 나오면 안 되므로 숨긴다.
const HIDE_DEV_CHROME = `
  nextjs-portal, [data-next-badge-root], [data-nextjs-toast], #__next-build-watcher {
    display: none !important;
  }
`;

test('투어 가계부 스크린샷 캡처', async ({ page, context }) => {
  test.setTimeout(300_000);
  mkdirSync(OUT_DIR, { recursive: true });

  // 1) 데모 커플 + 데이터 시드
  await clearEmulatorData();
  await context.clearCookies();
  const uid1 = await createTestUser(EMAIL_1, PASSWORD);
  const uid2 = await createTestUser(EMAIL_2, PASSWORD);
  const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
  await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
  await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });
  await seedDemoData(coupleId, uid1, uid2);

  // 2) 예산(연간계획) 시드 — 예산 화면 + 결산 '예산 vs 실적'에 사용.
  //    실제 시드된 카테고리 ID에 연결해야 결산 차트 라벨이 카테고리명으로 표시된다.
  const catIds = await getCategoryIdsByName(coupleId);
  const year = new Date().getFullYear();
  const planId = await seedAnnualPlan(coupleId, year, uid1);
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: catIds['정기급여'],
    group: 'income',
    subGroup: 'regular_income',
    monthlyAmounts: Array(12).fill(6_000_000),
    inputMode: 'regular',
  });
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: catIds['월세'],
    group: 'expense',
    subGroup: 'fixed_expense',
    monthlyAmounts: Array(12).fill(850_000),
  });
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: catIds['식비'],
    group: 'expense',
    subGroup: 'variable_common',
    monthlyAmounts: Array(12).fill(600_000),
  });
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: catIds['소비'],
    group: 'flex',
    subGroup: 'personal_flex',
    monthlyAmounts: Array(12).fill(300_000),
  });

  // 3) 라우트 사전 컴파일(next dev 온디맨드 컴파일이 캡처 중 일어나지 않도록)
  for (const s of SCREENS) {
    await page.request
      .get(s.path, { headers: { cookie: 'uandi-auth=with_couple' }, timeout: 90_000 })
      .catch(() => {});
  }

  // 4) 로그인
  await page.goto('/');
  await signIn(page, EMAIL_1, PASSWORD);
  await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 15000 });

  // 5) 화면별 캡처 → 상단 헤더·하단 Bottom Nav 영역을 잘라내고 콘텐츠만 webp 로 저장
  const DSF = 3; // playwright.screenshots.config.ts 의 deviceScaleFactor
  console.log(`\n투어 스크린샷 저장 위치: ${OUT_DIR}\n`);
  for (const s of SCREENS) {
    await page.goto(s.path, { waitUntil: 'domcontentloaded' });
    if (s.waitFor) {
      await page.waitForSelector(s.waitFor, { timeout: 15000 }).catch(() => {});
    }
    await page.addStyleTag({ content: HIDE_DEV_CHROME }).catch(() => {});
    await page.waitForTimeout(2500);

    // 상단 헤더와 하단 탭(Bottom Nav)의 실제 위치를 측정해 그 사이 콘텐츠 영역만 남긴다.
    const headerBox = await page
      .locator('header')
      .first()
      .boundingBox()
      .catch(() => null);
    const navBox = await page
      .getByTestId('app-nav')
      .boundingBox()
      .catch(() => null);

    const raw = await page.screenshot({ animations: 'disabled' });
    const { width: rawWidth = 0, height: rawHeight = 0 } = await sharp(raw).metadata();

    let pipeline = sharp(raw);
    if (headerBox && navBox && rawWidth && rawHeight) {
      const top = Math.max(0, Math.round((headerBox.y + headerBox.height) * DSF));
      const bottom = Math.min(rawHeight, Math.round(navBox.y * DSF));
      const height = bottom - top;
      if (height > 0) {
        pipeline = sharp(raw).extract({ left: 0, top, width: rawWidth, height });
      }
    }

    const out = join(OUT_DIR, `${s.file}.webp`);
    await pipeline.resize({ width: 760 }).webp({ quality: 82 }).toFile(out);
    console.log(`  ✓ ${s.label.padEnd(16)} → ${s.file}.webp`);
  }

  console.log('\n완료.\n');
});
