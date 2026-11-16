import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  createTestUser,
  getAnnouncementNotificationEnabled,
  listAnnouncementPushes,
  listFcmTokens,
  seedAnnouncementPush,
  seedFcmToken,
  seedNotificationSettings,
  seedUserDocument,
} from '../helpers/emulator';
import { ANNOUNCEMENTS } from '../../src/content/announcements';

// 어드민 공지 푸시 — docs/pages/10-announcement-push.md
// 에뮬레이터에는 FCM이 없어 서버가 모의 발송한다(USE_PUSH_MOCK=true, invalid- 토큰은 실패 처리).

const ADMIN_EMAIL = 'admin@test.com'; // .env.test 의 ADMIN_EMAILS
const PASSWORD = 'testpassword123';
const EMAIL_A = 'user1@test.com'; // 픽스처 커플(짝꿍 있음)
const EMAIL_B = 'user2@test.com'; // 픽스처 커플(짝꿍 있음) — 공지 알림 끔
const EMAIL_C = 'solo-c@test.com'; // 짝꿍 없음 — 정상 토큰 + 무효 토큰
const EMAIL_D = 'solo-d@test.com'; // 짝꿍 없음 — 토큰 없음

const announcement = ANNOUNCEMENTS[0]!;

async function signInAs(page: Page, email: string) {
  await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      await w.__auth.signOut();
      await w.__signInWithEmailAndPassword(w.__auth, email, password);
    },
    { email, password: PASSWORD }
  );
  // 커플 없는 계정은 / 에서 온보딩으로 가므로, 온보딩 도착을 로그인 전환 완료 신호로 쓴다.
  await page.goto('/');
  await page.waitForURL('**/onboarding', { timeout: 15000 });
}

type Seeded = { uidA: string; uidB: string; uidC: string; uidD: string };

/** 픽스처 커플(A·B)에 짝꿍 없는 C·D와 운영자를 더하고, 운영자로 로그인해 /admin 을 연다. */
async function seedAndOpenAdmin(
  page: Page,
  { uid, coupleId }: { uid: string; coupleId: string },
  uidB: string
): Promise<Seeded> {
  const uidC = await createTestUser(EMAIL_C, PASSWORD);
  await seedUserDocument(uidC, EMAIL_C, null, { displayName: '혼자C' });
  const uidD = await createTestUser(EMAIL_D, PASSWORD);
  await seedUserDocument(uidD, EMAIL_D, null, { displayName: '혼자D' });
  const adminUid = await createTestUser(ADMIN_EMAIL, PASSWORD);
  await seedUserDocument(adminUid, ADMIN_EMAIL, null);

  await seedFcmToken(uid, 'tok-a', { platform: 'android' });
  await seedFcmToken(uidB, 'tok-b', { platform: 'ios' });
  await seedNotificationSettings(uidB, { coupleId, announcementEnabled: false });
  await seedFcmToken(uidC, 'tok-c', { platform: 'android' });
  await seedFcmToken(uidC, 'invalid-c', { platform: 'android' });

  await signInAs(page, ADMIN_EMAIL);
  await page.goto('/admin');
  await expect(page.getByTestId('admin-users-page')).toBeVisible({ timeout: 15000 });
  return { uidA: uid, uidB, uidC, uidD };
}

/** 본인 이메일 칸으로 행을 찾는다(짝꿍 열에도 상대 이메일이 보이므로 hasText 로는 두 행이 잡힌다). */
function userRow(page: Page, email: string) {
  return page
    .getByTestId('admin-user-row')
    .filter({ has: page.getByTestId('admin-user-email').getByText(email, { exact: true }) });
}

async function selectUsers(page: Page, emails: string[]) {
  for (const email of emails) {
    await userRow(page, email).getByTestId('admin-user-select').click();
  }
  await expect(page.getByTestId('admin-selected-count')).toHaveText(`${emails.length}명 선택`);
}

async function openPushTabAndPick(page: Page) {
  await page.getByTestId('admin-tab-push').click();
  await page.getByTestId('admin-push-announcement').click();
  await page.getByRole('option', { name: new RegExp(announcement.title) }).click();
}

async function expectPreview(
  page: Page,
  counts: {
    target: number;
    optedOut: number;
    noToken: number;
    alreadySent: number;
    eligible: number;
  }
) {
  const preview = page.getByTestId('admin-push-preview');
  await expect(preview.getByTestId('admin-push-count-target')).toHaveText(String(counts.target));
  await expect(preview.getByTestId('admin-push-count-opted-out')).toHaveText(
    String(counts.optedOut)
  );
  await expect(preview.getByTestId('admin-push-count-no-token')).toHaveText(String(counts.noToken));
  await expect(preview.getByTestId('admin-push-count-already-sent')).toHaveText(
    String(counts.alreadySent)
  );
  await expect(preview.getByTestId('admin-push-count-eligible')).toHaveText(
    String(counts.eligible)
  );
}

test.describe('어드민 공지 푸시', () => {
  test('고른 사용자 중 받을 수 있는 사람에게만 보내고, 기록을 남기고, 무효 토큰을 정리한다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    const { uidA, uidC } = await seedAndOpenAdmin(page, { uid: uid1, coupleId }, uid2);

    await selectUsers(page, [EMAIL_A, EMAIL_B, EMAIL_C, EMAIL_D]);
    await openPushTabAndPick(page);
    // 푸시 문구 미리보기: 제목 = 공지 제목
    await expect(page.getByTestId('admin-push-message')).toContainText(announcement.title);
    await expectPreview(page, { target: 4, optedOut: 1, noToken: 1, alreadySent: 0, eligible: 2 });

    await page.getByTestId('admin-push-send').click();
    const dialog = page.getByTestId('admin-push-confirm-dialog');
    await expect(dialog).toContainText('2명에게 공지 푸시를 보낼까요?');
    await expect(dialog).toContainText(announcement.title);
    await page.getByTestId('admin-push-confirm').click();

    await expect(page.getByText('2명에게 보냈어요 · 기기 1대 실패')).toBeVisible();

    await expect.poll(async () => (await listAnnouncementPushes()).length).toBe(1);
    const [log] = await listAnnouncementPushes();
    expect(log!.announcementId).toBe(announcement.id);
    expect(log!.sentUids.sort()).toEqual([uidA, uidC].sort());
    expect(log!.targetUids).toHaveLength(4);
    expect(log!.successCount).toBe(2);
    expect(log!.failureCount).toBe(1);
    expect(log!.sentByEmail).toBe(ADMIN_EMAIL);

    // 무효 토큰은 삭제되고 정상 토큰은 남는다
    expect(await listFcmTokens(uidC)).toEqual(['tok-c']);

    // 보낸 기록 + 같은 대상은 이제 이미 보냄
    await expect(page.getByTestId('admin-push-log')).toHaveCount(1);
    await expect(page.getByTestId('admin-push-log').first()).toContainText(announcement.title);
    await expectPreview(page, { target: 4, optedOut: 1, noToken: 1, alreadySent: 2, eligible: 0 });
  });

  test('같은 공지를 이미 받은 사람은 빠지고, 보낼 사람이 없으면 보내기가 비활성이다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedAnnouncementPush(announcement.id, [uid1]);
    await seedAndOpenAdmin(page, { uid: uid1, coupleId }, uid2);

    await selectUsers(page, [EMAIL_A]);
    await openPushTabAndPick(page);
    await expectPreview(page, { target: 1, optedOut: 0, noToken: 0, alreadySent: 1, eligible: 0 });
    await expect(page.getByTestId('admin-push-send')).toBeDisabled();
  });

  test('빠른 선택 「짝꿍 없음」은 짝꿍이 없는 사용자만 고른다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedAndOpenAdmin(page, { uid: uid1, coupleId }, uid2);

    await page.getByTestId('admin-quick-select-solo').click();
    // C·D·운영자(모두 커플 없음)
    await expect(page.getByTestId('admin-selected-count')).toHaveText('3명 선택');
    await expect(userRow(page, EMAIL_C).getByTestId('admin-user-select')).toBeChecked();
    await expect(userRow(page, EMAIL_D).getByTestId('admin-user-select')).toBeChecked();
    await expect(userRow(page, EMAIL_A).getByTestId('admin-user-select')).not.toBeChecked();
    await expect(userRow(page, EMAIL_B).getByTestId('admin-user-select')).not.toBeChecked();

    await page.getByTestId('admin-quick-select-clear').click();
    await expect(page.getByTestId('admin-selected-count')).toHaveText('0명 선택');
  });

  test('대상을 고르지 않으면 사용자 탭으로 안내한다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedAndOpenAdmin(page, { uid: uid1, coupleId }, uid2);

    await openPushTabAndPick(page);
    await expect(page.getByText('사용자 탭에서 대상을 골라 주세요')).toBeVisible();
    await expect(page.getByTestId('admin-push-send')).toBeDisabled();
    await page.getByTestId('admin-push-go-users').click();
    await expect(page.getByTestId('admin-user-search')).toBeVisible();
  });

  test('허용 목록에 없는 계정이 발송 API를 부르면 403', async ({ authedPage }) => {
    const status = await authedPage.evaluate(async (id) => {
      const w = window as any;
      const token = await w.__auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/announcements/${id}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uids: ['x'], dryRun: true }),
      });
      return res.status;
    }, announcement.id);
    expect(status).toBe(403);
    expect(await listAnnouncementPushes()).toHaveLength(0);
  });
});

test.describe('알림 설정 — 공지 알림', () => {
  test('공지 알림은 기본 켜짐이고, 끄고 저장하면 announcement.enabled=false 로 저장된다', async ({
    authedContext,
  }) => {
    const { page, uid } = authedContext;
    await page.goto('/inner/cashbook/history/weekly/notifications');

    const toggle = page.getByTestId('announcement-switch');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('data-state', 'checked');
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-state', 'unchecked');

    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('알림 설정이 저장되었습니다.')).toBeVisible();
    await expect.poll(() => getAnnouncementNotificationEnabled(uid)).toBe(false);
  });
});

test.describe('공지 푸시로 들어온 공지사항', () => {
  test('앱 안에서 다른 화면을 보다가 푸시로 들어와도 ←는 대시보드로 간다', async ({
    authedPage,
  }) => {
    // 내역 화면을 보던 중(앱 안 이동 기록이 있는 상태)
    await authedPage.getByTestId('dashboard-history-link').click();
    await authedPage.waitForURL('**/inner/cashbook/history');
    // 포그라운드 푸시 토스트의 「보기」와 같은 앱 안 이동
    // (useFcmForegroundMessages 의 onAction 이 router.push(click_action) 을 부른다)
    await authedPage.evaluate(() => (window as any).next.router.push('/announcements?from=push'));
    await authedPage.waitForURL('**/announcements?from=push');
    await expect(authedPage.getByTestId('announcements-page')).toBeVisible({ timeout: 15000 });

    await authedPage.getByTestId('header-back').click();
    await authedPage.waitForURL(/\/inner\/cashbook$/);
  });
});
