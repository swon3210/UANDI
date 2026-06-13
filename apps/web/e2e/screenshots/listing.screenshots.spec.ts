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

// Play Console 폰 스크린샷 슬롯(phoneScreenshots)에 그대로 들어갈 PNG를 생성한다.
// 앱은 웹을 감싼 WebView라 이 캡처가 실제 안드로이드 화면과 동일하다.
//
// 실행:  pnpm screenshots   (먼저 `pnpm emulators` 로 에뮬레이터 기동 필요)

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';

// apps/web/e2e/screenshots → apps/mobile/store/listings/ko-KR/images/phoneScreenshots
const OUT_DIR = join(__dirname, '../../../mobile/store/listings/ko-KR/images/phoneScreenshots');

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

  // 4) 화면별 캡처 (뷰포트 1컷, 차트 애니메이션 정지 후)
  // networkidle 은 Firestore 실시간 리스너 때문에 끝나지 않으므로 쓰지 않는다.
  console.log(`\n스크린샷 저장 위치: ${OUT_DIR}\n`);
  for (const s of SCREENS) {
    await page.goto(s.path, { waitUntil: 'domcontentloaded' });
    if (s.waitFor) {
      await page.waitForSelector(s.waitFor, { timeout: 15000 }).catch(() => {});
    }
    await page.addStyleTag({ content: HIDE_DEV_CHROME }).catch(() => {});
    // 차트/리스트 렌더 및 애니메이션이 끝나도록 잠시 대기
    await page.waitForTimeout(2500);
    const out = join(OUT_DIR, `${s.file}.png`);
    await page.screenshot({ path: out, animations: 'disabled' });
    console.log(`  ✓ ${s.label.padEnd(12)} → ${s.file}.png`);
  }

  console.log(`\n완료. \`pnpm play:listing:push -- --images-only\` 로 업로드하세요.\n`);
});
