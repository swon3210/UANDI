import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { OnboardingPage } from '../page-objects/OnboardingPage';
import { LandingPage } from '../page-objects/LandingPage';
import {
  clearEmulatorData,
  createTestUser,
  seedUserDocument,
  seedCouple,
  simulatePartnerJoin,
} from '../helpers/emulator';

const PASSWORD = 'testpassword123';

async function signInOnPage(page: Page, email: string) {
  await page.waitForFunction(
    () => typeof (window as any).__signInWithEmailAndPassword === 'function',
    { timeout: 10000 }
  );
  await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      await w.__signInWithEmailAndPassword(w.__auth, email, password);
    },
    { email, password: PASSWORD }
  );
}

/**
 * 초대 링크(/invite/{code})와 대시보드 초대 카드(짝꿍 미연결).
 * - 링크로 들어오면 코드를 기억해 두고 로그인 뒤 코드 입력 화면을 바로 연다
 * - 혼자 먼저 시작한 사람은 대시보드에서 코드·링크를 다시 꺼내 보낼 수 있고,
 *   짝꿍이 합류하면 새로고침 없이 연결 카드로 바뀐다
 */
test.describe('초대 링크', () => {
  test('비로그인으로 초대 링크에 들어오면 랜딩에 초대 배너가 보이고, 로그인 후 코드가 채워진 입력 화면이 열린다', async ({
    page,
    context,
  }) => {
    await clearEmulatorData();
    await context.clearCookies();
    const inviterUid = await createTestUser('inviter@test.com', PASSWORD);
    const coupleId = await seedCouple({
      uid: inviterUid,
      inviteCode: 'LINK01',
      createdByName: '진성',
    });
    // 실제 흐름처럼 생성자 문서에 coupleId가 있어야 합류한 상대가 이름을 읽을 수 있다
    await seedUserDocument(inviterUid, 'inviter@test.com', coupleId, { displayName: '진성' });

    const inviteeEmail = 'invitee@test.com';
    const inviteeUid = await createTestUser(inviteeEmail, PASSWORD);
    await seedUserDocument(inviteeUid, inviteeEmail, null, { displayName: '세진' });

    await page.goto('/invite/link01'); // 소문자도 허용
    await page.waitForURL('/');
    const landing = new LandingPage(page);
    await expect(landing.inviteBanner).toBeVisible();
    await expect(landing.inviteBanner).toContainText('LINK01');

    await signInOnPage(page, inviteeEmail);
    await page.waitForURL('**/onboarding');

    const onboarding = new OnboardingPage(page);
    // 선택 화면을 건너뛰고 코드가 채워진 입력 화면이 바로 열린다
    await expect(onboarding.inviteHint).toContainText('진성님의 초대예요', { timeout: 15000 });
    await expect(onboarding.connectButton).toBeEnabled();
    await onboarding.connectButton.click();
    await expect(onboarding.connectedState).toContainText('진성님과 연결됐어요', {
      timeout: 15000,
    });
  });

  test('커플이 이미 연결된 유저가 초대 링크로 들어오면 대시보드로 가고 코드는 무시된다', async ({
    authedPage,
  }) => {
    await authedPage.goto('/invite/ABC123');
    await authedPage.waitForURL(/\/inner\/cashbook$/);
    const pending = await authedPage.evaluate(() =>
      window.localStorage.getItem('uandi:pendingInviteCode')
    );
    expect(pending).toBeNull();
  });
});

test.describe('대시보드 초대 카드 (짝꿍 미연결)', () => {
  test('초대 카드의 짝꿍 초대하기로 코드 시트가 열리고, 짝꿍이 합류하면 연결 카드로 바뀐다', async ({
    noCoupleAuthedPage,
  }) => {
    const page = noCoupleAuthedPage;
    const onboarding = new OnboardingPage(page);
    await onboarding.createCoupleButton.click();
    await expect(onboarding.inviteCodeDisplay).toBeVisible();
    const code = await onboarding.readInviteCode();
    await onboarding.startAloneButton.click();
    await page.waitForURL(/\/inner\/cashbook$/);

    // 초대 카드 → 코드 시트
    const inviteCard = page.getByTestId('couple-status-invite');
    await expect(inviteCard).toBeVisible();
    await inviteCard.getByRole('button', { name: '짝꿍 초대하기' }).click();
    const sheet = page.getByTestId('invite-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId('invite-code')).toHaveText(
      new RegExp(code.split('').join('\\s*'))
    );

    // 짝꿍 합류 시뮬레이션
    const uid2 = await createTestUser('partner@test.com', PASSWORD);
    await seedUserDocument(uid2, 'partner@test.com', null, { displayName: '진성' });
    await simulatePartnerJoin(code, uid2, 'partner@test.com', '진성');

    // 새로고침 없이 시트가 닫히고 연결 카드 + 토스트
    await expect(sheet).toBeHidden({ timeout: 15000 });
    await expect(page.getByTestId('couple-status-card')).toContainText('진성', { timeout: 15000 });
    await expect(page.getByText('진성님이 합류했어요')).toBeVisible();
    await expect(inviteCard).toBeHidden();
  });
});
