import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { OnboardingPage } from '../page-objects/OnboardingPage';
import {
  createTestUser,
  seedUserDocument,
  seedCouple,
  lookupUserUid,
  getUserField,
  addMemberToCouple,
} from '../helpers/emulator';

test.describe('온보딩', () => {
  test.describe('선택 화면', () => {
    test('선택 화면에 두 가지 선택지가 표시된다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await expect(onboarding.createCoupleButton).toBeVisible();
      await expect(onboarding.joinCoupleButton).toBeVisible();
    });
  });

  test.describe('새 커플 공간 만들기', () => {
    test('클릭 후 6자리 초대 코드가 표시된다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await expect(onboarding.inviteCodeDisplay).toBeVisible();
      const code = await onboarding.inviteCodeDisplay.textContent();
      expect(code?.replace(/\s/g, '')).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('복사하기 버튼이 초대 코드를 클립보드에 복사한다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await noCoupleAuthedPage.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await onboarding.copyButton.click();
      const clipText = await noCoupleAuthedPage.evaluate(() => navigator.clipboard.readText());
      expect(clipText).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('상대방이 합류하면 자동으로 대시보드로 이동한다', async ({ noCoupleAuthedPage }) => {
      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.createCoupleButton.click();
      await expect(onboarding.inviteCodeDisplay).toBeVisible();

      // inviteCode 읽기
      const code = (await onboarding.inviteCodeDisplay.textContent())?.replace(/\s/g, '') ?? '';

      // 두 번째 유저 생성 후 코드로 합류 (직접 Firestore 업데이트로 시뮬레이션)
      const uid2 = await createTestUser('partner@test.com', 'testpassword123');
      await seedUserDocument(uid2, 'partner@test.com', null);

      // user1의 UID를 Auth Emulator에서 조회 → Firestore에서 coupleId 읽기
      const uid1 = await lookupUserUid('user1@test.com');
      const coupleId = uid1 ? await getUserField(uid1, 'coupleId') : null;

      // couple.memberUids에 uid2 추가 → 실시간 리스너가 감지 → 대시보드 이동
      if (coupleId) {
        await addMemberToCouple(coupleId, uid2);
        await seedUserDocument(uid2, 'partner@test.com', coupleId);
      }

      await noCoupleAuthedPage.waitForURL('/', { timeout: 60000 });
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
    });

    test('유효한 코드 입력 후 커플 연결 → 대시보드로 이동한다', async ({ noCoupleAuthedPage }) => {
      const uid2 = await createTestUser('partner2@test.com', 'testpassword123');
      await seedUserDocument(uid2, 'partner2@test.com', null);
      await seedCouple({ uid: uid2, inviteCode: 'VALID1' });

      const onboarding = new OnboardingPage(noCoupleAuthedPage);
      await onboarding.joinCoupleButton.click();
      await onboarding.fillOtp('VALID1');
      await onboarding.connectButton.click();
      await noCoupleAuthedPage.waitForURL('/');
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
