import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedUserDocument, seedCouplePresence, getCouplePresence } from '../helpers/emulator';

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';

test.describe('커플 상태 카드 (접속 상태 + 서로를 위한 한마디)', () => {
  test('짝꿍의 접속 상태와 한마디가 카드에 표시된다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });
    // 짝꿍(uid2)이 방금 접속했고 한마디를 남긴 상태로 심는다
    await seedCouplePresence(coupleId, {
      [uid2]: { lastSeenIso: new Date().toISOString(), message: '오늘도 고마워' },
    });

    await page.goto('/inner/cashbook');

    const card = page.getByTestId('couple-status-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('현우');
    await expect(card).toContainText('오늘도 고마워');
    await expect(card).toContainText('접속 중');
  });

  test('짝꿍이 오래 접속하지 않았으면 오프라인으로 표시된다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    await seedCouplePresence(coupleId, {
      [uid2]: { lastSeenIso: threeHoursAgo, message: '먼저 자~' },
    });

    await page.goto('/inner/cashbook');

    const card = page.getByTestId('couple-status-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('먼저 자~');
    // "N시간 전 접속"으로 표시되고 "접속 중"은 아니다
    await expect(card).not.toContainText('접속 중');
    await expect(card).toContainText('전 접속');
  });

  test('내 한마디를 남기면 카드와 Firestore에 반영된다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });
    await seedCouplePresence(coupleId, {
      [uid2]: { lastSeenIso: new Date().toISOString(), message: '사랑해' },
    });

    await page.goto('/inner/cashbook');

    // 내 말풍선을 탭해 편집 시트를 연다
    await page.getByTestId('couple-message-edit').click();
    const composer = page.getByTestId('couple-message-composer');
    await expect(composer).toBeVisible();

    await page.getByTestId('couple-message-input').fill('먼저 자고 있을게');
    await page.getByTestId('couple-message-submit').click();

    // 성공 토스트
    await expect(page.getByText('한마디를 남겼어요 🐹')).toBeVisible();

    // 카드 내 내 말풍선에 반영 (onSnapshot 실시간)
    await expect(page.getByTestId('couple-status-card')).toContainText('먼저 자고 있을게');

    // Firestore presence 문서에 저장됐는지 확인
    await expect
      .poll(async () => (await getCouplePresence(coupleId))[uid1]?.message, { timeout: 10000 })
      .toBe('먼저 자고 있을게');
  });
});
