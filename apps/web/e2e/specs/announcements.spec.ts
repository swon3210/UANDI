import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { getUserLastSeenAnnouncementId, patchUserAnnouncementFields } from '../helpers/emulator';
import { ANNOUNCEMENTS } from '../../src/content/announcements';

// 공지사항 — docs/pages/09-announcements.md
// 공지 문구는 원본 파일(ANNOUNCEMENTS)에서 가져와 비교한다(문구가 바뀌어도 테스트를 고치지 않도록).

const SHEET = 'announcement-sheet';
/** 모든 공지보다 앞선 가입일 — 아직 본 적 없는 기존 사용자 */
const LONG_AGO = new Date('2020-01-01T00:00:00+09:00');
/** 투어와 같은 지연(1.5초) 뒤에 열리므로 넉넉히 기다린다 */
const OPEN_TIMEOUT = 15000;
/** "열리지 않음"을 확인할 때 지연 시간을 충분히 넘겨 기다린다 */
const NOT_OPEN_WAIT_MS = 3000;

const latest = ANNOUNCEMENTS[0];

async function reloadDashboard(page: Page) {
  await page.goto('/inner/cashbook');
  await expect(page.getByTestId('dashboard-header')).toBeVisible({ timeout: 15000 });
}

async function expectSheetNotOpened(page: Page) {
  await expect(page.getByTestId('dashboard-header')).toBeVisible();
  await page.waitForTimeout(NOT_OPEN_WAIT_MS);
  await expect(page.getByTestId(SHEET)).toHaveCount(0);
}

test.describe('공지사항', () => {
  test.describe('대시보드 공지 시트', () => {
    test('가입 전 공지를 아직 안 본 사용자는 대시보드에서 시트를 보고, 확인 후엔 다시 뜨지 않는다', async ({
      authedContext,
    }) => {
      const { page, uid } = authedContext;
      await patchUserAnnouncementFields(uid, { createdAt: LONG_AGO });
      await reloadDashboard(page);

      const sheet = page.getByTestId(SHEET);
      await expect(sheet).toBeVisible({ timeout: OPEN_TIMEOUT });
      await expect(sheet).toContainText('새 소식');
      // 최신순 — 첫 항목이 가장 최신 공지
      await expect(sheet.getByTestId('announcement-title').first()).toHaveText(latest.title);
      await expect(sheet.getByTestId('announcement-item')).toHaveCount(
        Math.min(ANNOUNCEMENTS.length, 3)
      );

      await page.getByTestId('announcement-confirm').click();
      await expect(sheet).toBeHidden();
      // 열리는 순간 최신 id로 읽음 기록
      await expect.poll(() => getUserLastSeenAnnouncementId(uid)).toBe(latest.id);

      await reloadDashboard(page);
      await expectSheetNotOpened(page);
    });

    test('방금 가입한 사용자에게는 가입 전 공지 시트가 뜨지 않는다', async ({ authedPage }) => {
      // 기본 픽스처는 가입일이 "지금"
      await expectSheetNotOpened(authedPage);
    });

    test('최신 공지를 이미 본 사용자에게는 시트가 뜨지 않는다', async ({ authedContext }) => {
      const { page, uid } = authedContext;
      await patchUserAnnouncementFields(uid, {
        createdAt: LONG_AGO,
        lastSeenAnnouncementId: latest.id,
      });
      await reloadDashboard(page);
      await expectSheetNotOpened(page);
    });

    test('바로 가기 버튼을 누르면 시트가 닫히고 해당 화면으로 이동한다', async ({
      authedContext,
    }) => {
      const withLink = ANNOUNCEMENTS.slice(0, 3).find((a) => a.link);
      test.skip(!withLink, '시트에 보이는 공지 중 바로 가기가 있는 공지가 없음');
      const { page, uid } = authedContext;
      await patchUserAnnouncementFields(uid, { createdAt: LONG_AGO });
      await reloadDashboard(page);

      const sheet = page.getByTestId(SHEET);
      await expect(sheet).toBeVisible({ timeout: OPEN_TIMEOUT });
      await sheet.getByRole('button', { name: withLink!.link!.label }).click();
      await page.waitForURL(`**${withLink!.link!.href}`);
      await expect(sheet).toBeHidden();
    });
  });

  test.describe('온보딩 투어와 겹치지 않음', () => {
    test.use({ seedTourSeen: false });

    test('투어를 아직 안 본 방문에는 투어만 열리고 공지 시트는 열리지 않는다', async ({
      authedContext,
    }) => {
      const { page, uid } = authedContext;
      // 첫 로드에서 투어가 열리며 seen이 기록되므로, 가입일을 바꾼 뒤 seen을 지우고 다시 들어온다
      await expect(page.getByTestId('service-tour-overlay')).toBeVisible({ timeout: OPEN_TIMEOUT });
      await patchUserAnnouncementFields(uid, { createdAt: LONG_AGO });
      await page.evaluate(() => window.localStorage.removeItem('moa:tour:v1'));
      await reloadDashboard(page);

      await expect(page.getByTestId('service-tour-overlay')).toBeVisible({ timeout: OPEN_TIMEOUT });
      await page.waitForTimeout(NOT_OPEN_WAIT_MS);
      await expect(page.getByTestId(SHEET)).toHaveCount(0);
    });
  });

  test.describe('공지사항 목록 (/settings/announcements)', () => {
    test('설정에서 들어가 모든 공지를 최신순으로 보고, ←로 설정에 돌아온다', async ({
      authedPage,
    }) => {
      await authedPage.goto('/settings');
      await authedPage.getByTestId('settings-announcements').click();
      await authedPage.waitForURL('**/settings/announcements');

      const pageRoot = authedPage.getByTestId('announcements-page');
      await expect(pageRoot).toBeVisible();
      await expect(authedPage.getByTestId('announcements-header')).toContainText('공지사항');
      await expect(pageRoot.getByTestId('announcement-title')).toHaveText(
        ANNOUNCEMENTS.map((a) => a.title)
      );

      await authedPage.getByTestId('header-back').click();
      await authedPage.waitForURL(/\/settings$/);
    });

    test('목록을 본 뒤에는 대시보드에서 공지 시트가 뜨지 않는다', async ({ authedContext }) => {
      const { page, uid } = authedContext;
      await patchUserAnnouncementFields(uid, { createdAt: LONG_AGO });

      await page.goto('/settings/announcements');
      await expect(page.getByTestId('announcements-page')).toBeVisible();
      await expect.poll(() => getUserLastSeenAnnouncementId(uid)).toBe(latest.id);

      await reloadDashboard(page);
      await expectSheetNotOpened(page);
    });
  });
});
