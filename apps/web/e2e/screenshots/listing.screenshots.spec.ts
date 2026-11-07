import { test, type Page, type Route } from '@playwright/test';
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

// 원본 캡처 → apps/mobile/store/raw-screenshots/{phone,seven,ten}
// (scripts/store-marketing-images.mjs 가 상단 문구를 얹어 스토어 규격 이미지로 합성한다)
const RAW_DIR = join(__dirname, '../../../mobile/store/raw-screenshots');

// 캡처할 디바이스 프로파일. playwright.screenshots.config.ts 의 deviceScaleFactor(=3)와
// 곱해진 픽셀 크기가 최종 PNG 해상도가 된다.
//   - phone:      412×800  × 3 = 1236×2400  (세로형 모바일 레이아웃, 세로:가로 ≈ 1.94:1, Play 폰 규격)
//   - sevenInch:  1024×576 × 3 = 3072×1728  (가로형 16:9)
//   - tenInch:    1152×648 × 3 = 3456×1944  (가로형 16:9, 각 변 ≤ 3840)
// 태블릿은 실제 태블릿 화면과 똑같이 보이도록 CSS 너비를 md 브레이크포인트(768px) 이상으로 잡아
// 데스크톱 레이아웃(좌측 네비 레일)이 렌더되게 한다. Play 태블릿 슬롯은 16:9 또는 9:16을 받는다.
type Device = { name: string; dir: string; viewport: { width: number; height: number } };
const DEVICES: Device[] = [
  { name: '폰', dir: 'phone', viewport: { width: 412, height: 800 } },
  { name: '7" 태블릿', dir: 'seven', viewport: { width: 1024, height: 576 } },
  { name: '10" 태블릿', dir: 'ten', viewport: { width: 1152, height: 648 } },
];

// 캡처할 화면. 파일명 앞 숫자가 스토어 노출 순서가 된다. (2026-11: 가계부 5화면, Play·App Store 공통)
// prepare: 이동 후 캡처 전에 한 번 실행 — 시트 열기·단계 진행 등.
// settle: 뷰포트 전환 후 추가 대기(ms). 차트 애니메이션이 끝까지 그려지게 한다.
type Screen = {
  path: string;
  file: string;
  label: string;
  waitFor?: string;
  settle?: number;
  prepare?: (page: Page) => Promise<void>;
};

/** 지난달 1일(YYYY-MM-01). 데모 내역이 지난달에 몰려 있어 대시보드는 지난달을 찍는다. */
function lastMonthAt(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
const DASHBOARD = `/inner/cashbook?at=${lastMonthAt()}`;

const SCREENS: Screen[] = [
  {
    path: DASHBOARD,
    file: '1-dashboard',
    label: '대시보드',
    waitFor: '[data-testid="recent-entries"]',
    settle: 1500,
  },
  {
    path: DASHBOARD,
    file: '2-quick-add',
    label: '빠른 추가(AI 입력)',
    waitFor: '[data-testid="dashboard-header"]',
    prepare: async (page) => {
      await page.getByTestId('cashbook-fab').click();
      await page.getByTestId('ai-parse-input').fill(QUICK_ADD_TEXT);
      await page.getByTestId('ai-parse-submit').click();
      await page.getByTestId('ai-bulk-preview-sheet').waitFor({ timeout: 20000 });
    },
  },
  {
    path: '/inner/cashbook/import',
    file: '3-import',
    label: '지난 내역 가져오기',
    waitFor: '[data-testid="import-step"]',
    prepare: async (page) => {
      await page.getByTestId('import-source-account').click();
      await page.getByTestId('ai-parse-input').fill('지난달 통장 내역');
      await page.getByTestId('ai-parse-submit').click();
      await page.locator('[data-testid="import-step"][data-step="2"]').waitFor({ timeout: 20000 });
      await page.getByTestId('import-next').click();
      await page.locator('[data-testid="import-step"][data-step="3"]').waitFor({ timeout: 20000 });
    },
  },
  { path: '/inner/cashbook/cashflow', file: '4-cashflow', label: '현금흐름 캘린더' },
  {
    path: '/inner/cashbook/plan/annual',
    file: '5-plan',
    label: '올해 예산(경제 목표)',
    waitFor: '[data-testid="annual-plan-header"]',
    settle: 1500,
  },
];

// ── AI 파싱 응답(스크린샷 전용) ──
// 에뮬레이터 목업은 입력과 무관한 예시를 돌려 같은 내역이 반복돼 보인다.
// 캡처에서만 parse-entries 응답을 가로채 입력과 맞는 현실적인 결과를 돌려준다.
const QUICK_ADD_TEXT = '점심 김치찌개 9천원, 퇴근길 택시 1만5천원, 장보기 4만7천원';

function isoDay(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** 두 달 전 그 날짜(YYYY-MM-DD). 가져오기 결과가 데모 시드(지난달)와 겹쳐 중복 의심으로 빠지지 않게 한다. */
function twoMonthsAgoDay(day: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const entry = (
  type: 'income' | 'expense',
  amount: number,
  category: string,
  description: string,
  date: string
) => ({ type, amount, category, description, date, confidence: 0.95, isTransfer: false });

async function fulfillParse(route: Route) {
  const body = route.request().postDataJSON() as { allowNewCategories?: boolean };
  if (body?.allowNewCategories) {
    // 지난 내역 가져오기: 두 달 전 통장 내역
    await route.fulfill({
      json: {
        entries: [
          entry('expense', 68_000, '식비', '이마트 장보기', twoMonthsAgoDay(3)),
          entry('expense', 55_000, '교통', '교통카드 충전', twoMonthsAgoDay(4)),
          entry('expense', 32_000, '소비', '영화 데이트', twoMonthsAgoDay(9)),
          entry('expense', 38_000, '반려동물', '강아지 사료', twoMonthsAgoDay(11)),
          entry('expense', 51_000, '식비', '주말 외식', twoMonthsAgoDay(12)),
          entry('expense', 240_000, '여행', '제주 항공권', twoMonthsAgoDay(16)),
          entry('income', 300_000, '부업', '블로그 수익', twoMonthsAgoDay(18)),
        ],
        suggestedCategories: [
          { name: '반려동물', group: 'expense', subGroup: 'variable_common', icon: 'paw_print' },
        ],
      },
    });
    return;
  }
  // 빠른 추가: QUICK_ADD_TEXT 세 줄
  await route.fulfill({
    json: {
      entries: [
        entry('expense', 9_000, '식비', '점심 김치찌개', isoDay(0)),
        entry('expense', 15_000, '교통', '퇴근길 택시', isoDay(0)),
        entry('expense', 47_000, '식비', '장보기', isoDay(0)),
      ],
      suggestedCategories: [],
    },
  });
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

// dev 모드 표시 배지(Next.js 로고 등)는 스토어 스크린샷에 나오면 안 되므로 숨긴다.
const HIDE_DEV_CHROME = `
  nextjs-portal, [data-next-badge-root], [data-nextjs-toast], #__next-build-watcher {
    display: none !important;
  }
  /* 현금흐름: 정기 항목 등록 제안·'AI 예상 내역'(에뮬레이터에선 로딩이 끝나지 않음)·예측 안내는
     스토어 이미지에선 숨긴다. CSS라 렌더 타이밍과 무관하게 적용된다. */
  [data-testid="recurrence-suggestion-list"],
  div:has(> div > [data-testid="cashflow-predict-status"]),
  [data-testid="cashflow-prediction-guide"],
  [data-sonner-toaster] {
    display: none !important;
  }
`;

test('스토어 등록정보 스크린샷 캡처', async ({ page, context }) => {
  test.setTimeout(600_000);
  for (const d of DEVICES) {
    mkdirSync(join(RAW_DIR, d.dir), { recursive: true });
  }
  await page.route('**/api/ai/parse-entries', fulfillParse);

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

  // 3) 로그인. 첫 진입 투어가 대시보드를 덮지 않도록 본 것으로 표시해 둔다.
  await context.addInitScript(() => {
    window.localStorage.setItem('moa:tour:v1', 'true');
  });
  await page.goto('/');
  await signIn(page, EMAIL_1, PASSWORD);
  await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 15000 });

  // 4) 화면별 캡처. 화면마다 한 번만 이동(goto)하고, 디바이스별로 뷰포트만 바꿔가며 찍는다.
  //    (디바이스마다 재이동하면 next dev 의 라우트 재컴파일 부담이 커져 dev 서버가 죽을 수 있으므로
  //     이동 횟수를 화면 수만큼으로 유지한다. 폰=모바일 레이아웃, 태블릿=데스크톱 레이아웃이
  //     뷰포트 너비에 따라 자동 전환되며, 변경 후 리플로우가 끝나도록 대기한다.)
  // networkidle 은 Firestore 실시간 리스너 때문에 끝나지 않으므로 쓰지 않는다.
  console.log(`\n원본 저장 위치: ${RAW_DIR}\n`);
  for (const s of SCREENS) {
    await page.goto(s.path, { waitUntil: 'domcontentloaded' });
    if (s.waitFor) {
      await page.waitForSelector(s.waitFor, { timeout: 15000 }).catch(() => {});
    }
    await page.addStyleTag({ content: HIDE_DEV_CHROME }).catch(() => {});
    if (s.prepare) await s.prepare(page);
    console.log(`[${s.label}] ${s.path}`);
    for (const d of DEVICES) {
      await page.setViewportSize(d.viewport);
      // 뷰포트 변경에 따른 리플로우/차트 리렌더 및 애니메이션이 끝나도록 잠시 대기
      await page.waitForTimeout(2500 + (s.settle ?? 0));
      // 차트 위에 뜬 hover 툴팁 등 잔여 오버레이 제거 후 캡처
      await page.mouse.move(2, 2).catch(() => {});
      await page.waitForTimeout(250);
      const out = join(RAW_DIR, d.dir, `${s.file}.png`);
      await page.screenshot({ path: out, animations: 'disabled' });
      console.log(`  ✓ ${d.name.padEnd(8)} → ${d.dir}/${s.file}.png`);
    }
  }

  console.log(`\n완료. \`node scripts/store-marketing-images.mjs\` 로 합성하세요.\n`);
});
