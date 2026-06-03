import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CommunityAdminPage } from '../page-objects/CommunityAdminPage';
import { seedCommunitySource } from '../helpers/emulator';

test.describe('커뮤니티 크롤 소스 관리 (/community/admin · 소스 관리)', () => {
  test('admin은 소스 관리 탭을 본다', async ({ adminAuthedContext }) => {
    const { page } = adminAuthedContext;
    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await expect(admin.sourcesTab).toBeVisible();
  });

  test('소스를 추가하면 목록에 노출된다', async ({ adminAuthedContext }) => {
    const { page } = adminAuthedContext;
    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await admin.sourcesTab.click();
    await admin.addSourceButton.click();

    const form = page.getByTestId('source-form');
    await expect(form).toBeVisible();
    await form.getByTestId('source-sitename').fill('결혼 매거진');
    await form.getByTestId('source-feedurl').fill('https://example.com/wedding/rss');
    await form.getByRole('button', { name: '추가하기' }).click();

    await expect(admin.sourceItems).toHaveCount(1);
    await expect(admin.sourceItems.first()).toContainText('결혼 매거진');
  });

  test('소스를 비활성화하면 토글 상태가 유지된다', async ({ adminAuthedContext }) => {
    const { page } = adminAuthedContext;
    await seedCommunitySource({
      siteName: '토글 테스트',
      feedUrl: 'https://example.com/toggle/rss',
      enabled: true,
    });

    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await admin.sourcesTab.click();

    const item = admin.sourceItems.first();
    const toggle = admin.sourceToggle(item);
    await expect(toggle).toHaveAttribute('data-state', 'checked');
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-state', 'unchecked');

    // 새로고침 후에도 비활성 유지
    await admin.goto();
    await admin.sourcesTab.click();
    await expect(admin.sourceToggle(admin.sourceItems.first())).toHaveAttribute(
      'data-state',
      'unchecked'
    );
  });

  test('소스를 삭제하면 목록에서 사라진다', async ({ adminAuthedContext }) => {
    const { page } = adminAuthedContext;
    await seedCommunitySource({
      siteName: '삭제 테스트',
      feedUrl: 'https://example.com/delete/rss',
    });

    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await admin.sourcesTab.click();

    const item = admin.sourceItems.first();
    await expect(item).toBeVisible();
    await admin.deleteButton(item).click();

    const dialog = page.getByTestId('source-delete-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '삭제' }).click();

    await expect(admin.sourceItems).toHaveCount(0);
  });

  test('"지금 수집"으로 RSS 피드의 글이 승인 대기로 수집된다', async ({
    adminAuthedContext,
    baseURL,
  }) => {
    const { page } = adminAuthedContext;
    // 크롤 라우트는 같은 Next 서버에서 돌므로 public 픽스처 피드를 자기 자신이 fetch한다.
    await seedCommunitySource({
      siteName: '테스트 신혼 피드',
      feedUrl: `${baseURL}/test-fixtures/sample-feed.xml`,
      enabled: true,
    });

    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await admin.sourcesTab.click();
    await admin.crawlNowButton.click();

    // 수집 완료 토스트 후 승인 대기 탭에 픽스처 항목 2건이 노출
    await admin.pendingTab.click();
    await expect(admin.pendingCards).toHaveCount(2);
    await expect(admin.pendingCards.first()).toContainText('설거지');

    // 같은 피드를 다시 수집해도 중복 생성되지 않는다
    await admin.sourcesTab.click();
    await admin.crawlNowButton.click();
    await admin.pendingTab.click();
    await expect(admin.pendingCards).toHaveCount(2);
  });

  test('인증 없이 소스 API를 호출하면 401', async ({ request }) => {
    const res = await request.post('/api/community/sources', {
      data: { siteName: 'x', feedUrl: 'https://example.com/rss' },
    });
    expect(res.status()).toBe(401);
  });
});
