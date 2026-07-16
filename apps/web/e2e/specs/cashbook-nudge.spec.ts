import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedUserDocument, seedNudge, listNudges } from '../helpers/emulator';

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';

test.describe('가계부 입력 요청 "콕 찌르기"', () => {
  test('대시보드에서 파트너에게 콕 찌르기를 보내면 nudge 문서가 생성된다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });

    await page.goto('/inner/cashbook');

    // 파트너 이름이 붙은 콕 찌르기 버튼이 보인다
    const nudgeButton = page.getByTestId('nudge-button');
    await expect(nudgeButton).toBeVisible();
    await expect(nudgeButton).toContainText('현우');

    // 시트를 열고 기본 프리셋으로 발송
    await nudgeButton.click();
    await expect(page.getByTestId('nudge-composer')).toBeVisible();

    const submit = page.getByTestId('nudge-submit');
    await expect(submit).toBeEnabled();
    await submit.click();

    // 성공 토스트
    await expect(page.getByText('입력 요청을 보냈어요 🐹')).toBeVisible();

    // Firestore에 pending nudge가 생성됐는지 확인
    await expect
      .poll(async () => (await listNudges(coupleId)).length, { timeout: 10000 })
      .toBe(1);

    const nudges = await listNudges(coupleId);
    expect(nudges[0]).toMatchObject({
      fromUid: uid1,
      toUid: uid2,
      type: 'record-request',
      status: 'pending',
      message: '오늘 쓴 거 입력해줘',
    });
  });

  test('최근(쿨다운 30분 이내) 요청이 있으면 다시 보낼 수 없다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });

    // 방금(쿨다운 이내) 보낸 넛지를 심는다
    await seedNudge(coupleId, uid1, uid2, { status: 'pending', message: '오늘 쓴 거 입력해줘' });

    await page.goto('/inner/cashbook');
    await page.getByTestId('nudge-button').click();

    const composer = page.getByTestId('nudge-composer');
    await expect(composer).toBeVisible();

    // 발송 버튼 비활성 + 남은 쿨다운 안내 문구
    await expect(page.getByTestId('nudge-submit')).toBeDisabled();
    await expect(page.getByTestId('nudge-disabled-reason')).toContainText('다시 보낼 수 있어요');
  });

  test('마지막 요청이 쿨다운(30분)을 지났으면 다시 보낼 수 있다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우' });

    // 31분 전에 보낸(= 쿨다운 만료) 넛지를 심는다. 상대가 확인하지 않아도 다시 보낼 수 있어야 한다.
    const thirtyOneMinAgo = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    await seedNudge(coupleId, uid1, uid2, {
      status: 'pending',
      message: '오늘 쓴 거 입력해줘',
      createdAt: thirtyOneMinAgo,
    });

    await page.goto('/inner/cashbook');
    await page.getByTestId('nudge-button').click();

    const composer = page.getByTestId('nudge-composer');
    await expect(composer).toBeVisible();

    // 쿨다운이 지났으므로 발송 가능, 안내 문구 없음
    await expect(page.getByTestId('nudge-submit')).toBeEnabled();
    await expect(page.getByTestId('nudge-disabled-reason')).toHaveCount(0);
  });

  test('알림 설정에서 입력 요청 알림을 끄고 저장할 수 있다', async ({ authedContext }) => {
    const { page } = authedContext;

    await page.goto('/inner/cashbook/history/weekly/notifications');

    const toggle = page.getByTestId('record-request-switch');
    await expect(toggle).toBeVisible();

    // 기본값 on → off로 전환
    await toggle.click();

    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('알림 설정이 저장되었습니다.')).toBeVisible();
  });
});
