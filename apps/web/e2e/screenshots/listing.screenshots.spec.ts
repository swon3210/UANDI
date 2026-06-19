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

// Play Console 스크린샷 슬롯(phone / 7" 태블릿 / 10" 태블릿)에 그대로 들어갈 PNG를 생성한다.
// 앱은 웹을 감싼 WebView라 이 캡처가 실제 안드로이드 화면과 동일하다.
//
// 실행:  pnpm screenshots   (먼저 `pnpm emulators` 로 에뮬레이터 기동 필요)

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';

// apps/web/e2e/screenshots → apps/mobile/store/listings/ko-KR/images
const IMAGES_DIR = join(__dirname, '../../../mobile/store/listings/ko-KR/images');

// 캡처할 디바이스 프로파일. playwright.screenshots.config.ts 의 deviceScaleFactor(=3)와
// 곱해진 픽셀 크기가 최종 PNG 해상도가 된다.
//   - phone:      412×800  × 3 = 1236×2400  (세로형 모바일 레이아웃, 세로:가로 ≈ 1.94:1, Play 폰 규격)
//   - sevenInch:  1024×576 × 3 = 3072×1728  (가로형 16:9)
//   - tenInch:    1152×648 × 3 = 3456×1944  (가로형 16:9, 각 변 ≤ 3840)
// 태블릿은 실제 태블릿 화면과 똑같이 보이도록 CSS 너비를 md 브레이크포인트(768px) 이상으로 잡아
// 데스크톱 레이아웃(좌측 네비 레일)이 렌더되게 한다. Play 태블릿 슬롯은 16:9 또는 9:16을 받는다.
type Device = { name: string; dir: string; viewport: { width: number; height: number } };
const DEVICES: Device[] = [
  { name: '폰', dir: 'phoneScreenshots', viewport: { width: 412, height: 800 } },
  { name: '7" 태블릿', dir: 'sevenInchScreenshots', viewport: { width: 1024, height: 576 } },
  { name: '10" 태블릿', dir: 'tenInchScreenshots', viewport: { width: 1152, height: 648 } },
];

// 캡처할 화면. 파일명 앞 숫자가 Play 스토어 노출 순서가 된다.
// (play-listing.mjs 가 파일명을 숫자순으로 정렬해 업로드)
type Screen = { path: string; file: string; label: string; waitFor?: string };
const SCREENS: Screen[] = [
  {
    path: '/inner',
    file: '1-dashboard',
    label: '대시보드',
    waitFor: '[data-testid="dashboard-header"]',
  },
  { path: '/inner/cashbook/history', file: '2-cashbook', label: '가계부 내역' },
  { path: '/inner/cashbook/cashflow', file: '3-cashflow', label: '현금흐름 캘린더' },
  { path: '/outer/allocation', file: '4-allocation', label: '자산 배분' },
  { path: '/community', file: '5-community', label: '커뮤니티' },
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

// dev 모드 표시 배지(Next.js 로고 등)는 스토어 스크린샷에 나오면 안 되므로 숨긴다.
const HIDE_DEV_CHROME = `
  nextjs-portal, [data-next-badge-root], [data-nextjs-toast], #__next-build-watcher {
    display: none !important;
  }
`;

test('스토어 등록정보 스크린샷 캡처', async ({ page, context }) => {
  test.setTimeout(600_000);
  for (const d of DEVICES) {
    mkdirSync(join(IMAGES_DIR, d.dir), { recursive: true });
  }

  // 1) 데모 커플 + 데이터 시드
  await clearEmulatorData();
  await context.clearCookies();
  const uid1 = await createTestUser(EMAIL_1, PASSWORD);
  const uid2 = await createTestUser(EMAIL_2, PASSWORD);
  const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
  await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
  await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });
  await seedDemoData(coupleId, uid1, uid2);

  // 2) 라우트 사전 컴파일(서버 측). next dev 는 첫 방문 시 온디맨드 컴파일을 하는데,
  //    브라우저가 살아있는 상태에서 무거운 라우트를 컴파일하면 dev 서버가 죽는 경우가 있다.
  //    가벼운 GET 으로 미리 컴파일해두면(쿠키로 미들웨어 통과) 캡처 중엔 컴파일이 없다.
  for (const s of SCREENS) {
    await page.request
      .get(s.path, { headers: { cookie: 'uandi-auth=with_couple' }, timeout: 90_000 })
      .catch(() => {});
  }

  // 3) 로그인
  await page.goto('/');
  await signIn(page, EMAIL_1, PASSWORD);
  await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 15000 });

  // 4) 화면별 캡처. 화면마다 한 번만 이동(goto)하고, 디바이스별로 뷰포트만 바꿔가며 찍는다.
  //    (디바이스마다 재이동하면 next dev 의 라우트 재컴파일 부담이 커져 dev 서버가 죽을 수 있으므로
  //     이동 횟수를 화면 수만큼으로 유지한다. 폰=모바일 레이아웃, 태블릿=데스크톱 레이아웃이
  //     뷰포트 너비에 따라 자동 전환되며, 변경 후 리플로우가 끝나도록 대기한다.)
  // networkidle 은 Firestore 실시간 리스너 때문에 끝나지 않으므로 쓰지 않는다.
  console.log(`\n스크린샷 저장 위치: ${IMAGES_DIR}\n`);
  for (const s of SCREENS) {
    await page.goto(s.path, { waitUntil: 'domcontentloaded' });
    if (s.waitFor) {
      await page.waitForSelector(s.waitFor, { timeout: 15000 }).catch(() => {});
    }
    await page.addStyleTag({ content: HIDE_DEV_CHROME }).catch(() => {});
    console.log(`[${s.label}] ${s.path}`);
    for (const d of DEVICES) {
      await page.setViewportSize(d.viewport);
      // 뷰포트 변경에 따른 리플로우/차트 리렌더 및 애니메이션이 끝나도록 잠시 대기
      await page.waitForTimeout(2500);
      const out = join(IMAGES_DIR, d.dir, `${s.file}.png`);
      await page.screenshot({ path: out, animations: 'disabled' });
      console.log(`  ✓ ${d.name.padEnd(8)} → ${d.dir}/${s.file}.png`);
    }
  }

  console.log(`\n완료. \`pnpm play:listing:push -- --images-only\` 로 업로드하세요.\n`);
});
