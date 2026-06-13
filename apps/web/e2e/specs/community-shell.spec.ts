import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CommunityPage } from '../page-objects/CommunityPage';
import { AppNavPage } from '../page-objects/AppNavPage';

test.describe('커뮤니티 셸·네비게이션', () => {
  test('하단탭의 커뮤니티 탭을 누르면 /community로 이동한다', async ({ authedPage }) => {
    const nav = new AppNavPage(authedPage);
    await nav.tabCommunity.click();
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
