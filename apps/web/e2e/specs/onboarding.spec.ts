import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { OnboardingPage } from '../page-objects/OnboardingPage';
import {
  createTestUser,
  seedUserDocument,
  seedCouple,
  simulatePartnerJoin,
} from '../helpers/emulator';

test.describe('온보딩', () => {
  test.describe('선택 화면', () => {
    test('두 선택 카드와 각 설명이 표시된다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await expect(onboarding.createCoupleButton).toBeVisible();
      await expect(onboarding.createCoupleButton).toContainText('처음 시작해요');
      await expect(onboarding.createCoupleButton).toContainText('짝꿍을 초대해요');
      await expect(onboarding.joinCoupleButton).toBeVisible();
      await expect(onboarding.joinCoupleButton).toContainText('초대 코드를 받았어요');
      await expect(onboarding.joinCoupleButton).toContainText('6자리 코드로 합류해요');
    });
  });

  test.describe('새 커플 공간 만들기', () => {
    test('클릭 후 6자리 초대 코드가 표시된다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await expect(onboarding.inviteCodeDisplay).toBeVisible();
      expect(await onboarding.readInviteCode()).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('코드 복사 버튼이 초대 코드를 클립보드에 복사한다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await noCoupleAuthedPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await onboarding.copyButton.click();
      const clipText = await noCoupleAuthedPage.evaluate(() => navigator.clipboard.readText());
      expect(clipText).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('링크 공유는 공유 API가 없으면 초대 링크를 클립보드에 복사한다', async ({
      noCoupleAuthedPage,
    }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await expect(onboarding.inviteCodeDisplay).toBeVisible();
      const code = await onboarding.readInviteCode();

      await noCoupleAuthedPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      // 데스크톱 크로미움엔 navigator.share가 없다. 혹시 있어도 폴백 경로를 검증하도록 제거한다.
      await noCoupleAuthedPage.evaluate(() => {
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      });
      await onboarding.shareLinkButton.click();
      const clipText = await noCoupleAuthedPage.evaluate(() => navigator.clipboard.readText());
      expect(clipText).toBe(`${new URL(noCoupleAuthedPage.url()).origin}/invite/${code}`);
    });

    test('먼저 시작하기를 누르면 새로고침 없이 지난 내역 가져오기로 가고, 건너뛰면 초대 카드가 있는 대시보드가 보인다', async ({
      noCoupleAuthedPage,
    }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await expect(onboarding.inviteCodeDisplay).toBeVisible();

      await onboarding.startAloneButton.click();
      await noCoupleAuthedPage.waitForURL(/\/inner\/cashbook\/import\?onboarding=1$/);
      await noCoupleAuthedPage.getByTestId('import-skip').click();
      await noCoupleAuthedPage.waitForURL(/\/inner\/cashbook$/);
      await expect(noCoupleAuthedPage.getByTestId('dashboard-header')).toBeVisible();
      await expect(noCoupleAuthedPage.getByTestId('couple-status-invite')).toBeVisible();
    });

    test('상대방이 합류하면 연결 완료 화면이 뜨고 시작하기로 지난 내역 가져오기에 간다', async ({
      noCoupleAuthedPage,
    }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await expect(onboarding.inviteCodeDisplay).toBeVisible();
      const code = await onboarding.readInviteCode();

      const uid2 = await createTestUser('partner@test.com', 'testpassword123');
      await seedUserDocument(uid2, 'partner@test.com', null, { displayName: '진성' });
      await simulatePartnerJoin(code, uid2, 'partner@test.com', '진성');

      await expect(onboarding.connectedState).toBeVisible({ timeout: 15000 });
      await expect(onboarding.connectedState).toContainText('진성님과 연결됐어요');
      await onboarding.connectedStartButton.click();
      await noCoupleAuthedPage.waitForURL(/\/inner\/cashbook\/import\?onboarding=1$/);
    });

    test('뒤로 버튼을 누르면 선택 화면으로 돌아간다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await expect(onboarding.inviteCodeDisplay).toBeVisible();
      await onboarding.backButton.click();
      await expect(onboarding.createCoupleButton).toBeVisible();
    });
  });

  test.describe('초대 코드 입력', () => {
    test('6자리 입력 전 연결하기 버튼이 비활성화된다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await expect(onboarding.connectButton).toBeDisabled();
      await expect(onboarding.inviteHint).toBeHidden();
    });

    test('6자리를 입력하면 초대한 사람 이름 힌트가 표시된다', async ({ noCoupleAuthedPage }) => {
      const uid2 = await createTestUser('inviter@test.com', 'testpassword123');
      await seedUserDocument(uid2, 'inviter@test.com', null, { displayName: '진성' });
      await seedCouple({ uid: uid2, inviteCode: 'HINT01', createdByName: '진성' });

      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await onboarding.fillOtp('HINT01');
      await expect(onboarding.inviteHint).toContainText('진성님의 초대예요');
      await expect(onboarding.connectButton).toBeEnabled();
    });

    test('유효한 코드 입력 후 연결 완료 화면 → 시작하기 → 대시보드로 바로 이동한다(가져오기 생략)', async ({
      noCoupleAuthedPage,
    }) => {
      const uid2 = await createTestUser('partner2@test.com', 'testpassword123');
      await seedUserDocument(uid2, 'partner2@test.com', null, { displayName: '진성' });
      const coupleId = await seedCouple({ uid: uid2, inviteCode: 'VALID1', createdByName: '진성' });
      await seedUserDocument(uid2, 'partner2@test.com', coupleId, { displayName: '진성' });

      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await onboarding.fillOtp('VALID1');
      await onboarding.connectButton.click();

      await expect(onboarding.connectedState).toBeVisible({ timeout: 15000 });
      await expect(onboarding.connectedState).toContainText('진성님과 연결됐어요');
      await onboarding.connectedStartButton.click();
      // 합류한 사람은 가져오기를 거치지 않는다(같은 통장 내역을 둘이 올리면 중복되기 쉽다)
      await noCoupleAuthedPage.waitForURL(/\/inner\/cashbook$/);
      await expect(noCoupleAuthedPage.getByTestId('couple-status-card')).toBeVisible();
    });

    test('존재하지 않는 코드 → 에러 메시지 표시', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await onboarding.fillOtp('NOPE99');
      await onboarding.connectButton.click();
      await expect(onboarding.errorMessage).toContainText('존재하지 않는 초대 코드');
    });

    test('만료된 코드 → 에러 메시지 표시', async ({ noCoupleAuthedPage }) => {
      const uid2 = await createTestUser('expired@test.com', 'testpassword123');
      await seedUserDocument(uid2, 'expired@test.com', null);
      await seedCouple({ uid: uid2, inviteCode: 'EXPRD1', expiresInMs: -1000 });

      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await onboarding.fillOtp('EXPRD1');
      await onboarding.connectButton.click();
      await expect(onboarding.errorMessage).toContainText('초대 코드가 만료됐어요');
    });

    test('이미 2명인 커플 코드 → 에러 메시지 표시', async ({ noCoupleAuthedPage }) => {
      const uid2 = await createTestUser('full1@test.com', 'testpassword123');
      const uid3 = await createTestUser('full2@test.com', 'testpassword123');
      await seedCouple({ uid: uid2, inviteCode: 'FULL99', secondMemberUid: uid3 });

      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await onboarding.fillOtp('FULL99');
      await onboarding.connectButton.click();
      await expect(onboarding.errorMessage).toContainText('이미 연결된 커플');
    });

    test('자신이 만든 코드 → 에러 메시지 표시', async ({ noCoupleAuthedPage }) => {
      // 현재 로그인한 유저의 uid로 커플 생성
      const uid = await noCoupleAuthedPage.evaluate(
        () => ((window as any).__auth as any).currentUser?.uid
      );
      await seedCouple({ uid, inviteCode: 'SELF99' });

      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await onboarding.fillOtp('SELF99');
      await onboarding.connectButton.click();
      await expect(onboarding.errorMessage).toContainText('내가 만든 코드');
    });

    test('뒤로 버튼을 누르면 선택 화면으로 돌아간다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await onboarding.backButton.click();
      await expect(onboarding.createCoupleButton).toBeVisible();
    });
  });
});
