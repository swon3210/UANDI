import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CommunityPage } from '../page-objects/CommunityPage';
import { DashboardPage } from '../page-objects/DashboardPage';

test.describe('커뮤니티 셸·네비게이션', () => {
  test('사이드바를 열면 커뮤니티 섹션과 피드 항목이 표시된다', async ({ authedPage }) => {
    const dashboard = new DashboardPage(authedPage);
    await dashboard.sidebarTrigger.click();
    await expect(dashboard.sidebar).toBeVisible();
    await expect(dashboard.sidebar).toContainText('커뮤니티');
    await expect(dashboard.sidebar.getByRole('link', { name: '피드' })).toBeVisible();
  });

  test('사이드바에서 피드를 누르면 /community로 이동한다', async ({ authedPage }) => {
    const community = new CommunityPage(authedPage);
    await community.sidebarTrigger.click();
    await expect(community.sidebar).toBeVisible();
    await community.feedLink().click();
    await expect(authedPage).toHaveURL(/\/community$/, { timeout: 30000 });
  });

  test('/community 진입 시 헤더와 빈 상태가 표시된다', async ({ authedPage }) => {
    const community = new CommunityPage(authedPage);
    await community.goto();
    await expect(community.header).toBeVisible();
    await expect(community.emptyState).toBeVisible();
  });

  test('커뮤니티 공간 톤(data-space=community)이 적용된다', async ({ authedPage }) => {
    const community = new CommunityPage(authedPage);
    await community.goto();
    await expect(community.spaceRoot).toBeVisible();
  });
});
