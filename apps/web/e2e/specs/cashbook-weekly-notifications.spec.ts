import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedNotificationSettings } from '../helpers/emulator';
import { NotificationSettingsPage } from '../page-objects/NotificationSettingsPage';

test.describe('알림 설정', () => {
  test('알림 설정 페이지에 접근하면 기본값이 표시된다', async ({ authedContext }) => {
    const { page } = authedContext;

    const notifPage = new NotificationSettingsPage(page);
    await notifPage.goto();

    // 헤더가 표시됨
    await expect(notifPage.header).toBeVisible();
    await expect(notifPage.header).toContainText('알림 설정');

    // 기록 알림 토글이 표시됨
    await expect(notifPage.recordReminderSwitch).toBeVisible();

    // 예산 경고 토글이 표시됨
    await expect(notifPage.budgetWarningSwitch).toBeVisible();
  });

  test('기록 알림을 켜면 시간/요일 선택이 나타난다', async ({ authedContext }) => {
    const { page } = authedContext;

    const notifPage = new NotificationSettingsPage(page);
    await notifPage.goto();

    // 기록 알림 켜기
    await notifPage.recordReminderSwitch.click();

    // 시간 입력이 나타남
    await expect(notifPage.timeInput).toBeVisible();

    // 요일 선택이 나타남
    await expect(notifPage.dayButtons).toBeVisible();
  });

  test('설정을 변경하면 저장되고 새로고침 후에도 유지된다', async ({ authedContext }) => {
    const { page } = authedContext;

    const notifPage = new NotificationSettingsPage(page);
    await notifPage.goto();

    // 기록 알림 켜기
    await notifPage.recordReminderSwitch.click();

    // 저장 버튼 클릭
    await page.getByRole('button', { name: '저장' }).click();

    // 저장 완료 토스트 대기
    await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible({ timeout: 5000 });

    // 페이지 새로고침
    await notifPage.goto();

    // 기록 알림이 켜진 상태로 유지됨
    await expect(notifPage.timeInput).toBeVisible();
  });

  test('기존 설정이 있으면 불러와서 표시한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;

    // 시드 데이터로 알림 설정 생성
    await seedNotificationSettings(uid, {
      coupleId,
      recordReminderEnabled: true,
      recordReminderTime: '20:00',
      recordReminderDays: [1, 3, 5],
      budgetWarningEnabled: false,
    });

    const notifPage = new NotificationSettingsPage(page);
    await notifPage.goto();

    // 시간이 20:00으로 표시됨
    await expect(notifPage.timeInput).toHaveValue('20:00');

    // 요일 선택에서 월/수/금이 선택됨
    await expect(notifPage.dayButton('월')).toHaveAttribute('data-selected', 'true');
    await expect(notifPage.dayButton('수')).toHaveAttribute('data-selected', 'true');
    await expect(notifPage.dayButton('금')).toHaveAttribute('data-selected', 'true');

    // 화/목은 선택 안 됨
    await expect(notifPage.dayButton('화')).toHaveAttribute('data-selected', 'false');
    await expect(notifPage.dayButton('목')).toHaveAttribute('data-selected', 'false');
  });

  test('주간 예산 페이지에서 알림 설정으로 이동할 수 있다', async ({ authedContext }) => {
    const { page } = authedContext;

    // 주간 페이지로 이동 (예산 데이터 없어도 헤더는 표시됨)
    await page.goto('/cashbook/history/weekly');

    // 알림 설정 버튼 클릭
    const bellButton = page.getByRole('button', { name: '알림 설정' });
    await bellButton.click();

    // 알림 설정 페이지로 이동됨
    await expect(page).toHaveURL(/\/cashbook\/history\/weekly\/notifications/);
  });
});
