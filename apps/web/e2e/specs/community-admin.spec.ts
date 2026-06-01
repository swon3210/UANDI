import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CommunityPage } from '../page-objects/CommunityPage';
import { CommunityAdminPage } from '../page-objects/CommunityAdminPage';
import { seedCommunityPost } from '../helpers/emulator';

test.describe('커뮤니티 모더레이션 (/community/admin)', () => {
  test('비admin이 /community/admin에 접근하면 /community로 리다이렉트된다', async ({
    authedPage,
  }) => {
    await authedPage.goto('/community/admin');
    await expect(authedPage).toHaveURL(/\/community$/);
  });

  test('admin은 /community/admin에서 Tabs(승인 대기 / 신고됨)를 본다', async ({
    adminAuthedContext,
  }) => {
    const { page } = adminAuthedContext;
    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await expect(admin.root).toBeVisible();
    await expect(admin.pendingTab).toBeVisible();
    await expect(admin.reportedTab).toBeVisible();
  });

  test('승인 대기 글을 승인하면 피드에 노출된다', async ({ adminAuthedContext }) => {
    const { page } = adminAuthedContext;
    await seedCommunityPost({
      type: 'scraped',
      status: 'pending',
      title: '대기 중인 스크랩 글',
      body: '발췌 문구',
      publishedAt: null,
      source: {
        siteName: '어떤 사이트',
        url: 'https://example.com/article',
        sourceId: 'pending-hash',
      },
    });

    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await admin.pendingTab.click();
    const card = admin.pendingCards.first();
    await expect(card).toBeVisible();
    await admin.approveButton(card).click();

    // 피드로 이동해 노출 여부 확인
    const community = new CommunityPage(page);
    await community.goto();
    await expect(community.scrapedPostCards).toHaveCount(1);
    await expect(community.scrapedPostCards.first()).toContainText('대기 중인 스크랩 글');
  });

  test('신고됨 글을 숨김 처리하면 피드에서 사라진다', async ({ adminAuthedContext }) => {
    const { page } = adminAuthedContext;
    await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '신고 누적된 글',
      reportCount: 2,
      author: {
        uid: 'other-uid',
        coupleId: 'other-couple',
        displayName: 'Other',
      },
    });

    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await admin.reportedTab.click();
    const card = admin.reportedCards.first();
    await expect(card).toBeVisible();
    await admin.hideButton(card).click();

    const community = new CommunityPage(page);
    await community.goto();
    await expect(community.postCards).toHaveCount(0);
  });

  test('신고됨 글을 유지(reportCount 리셋)하면 피드에 그대로 남는다', async ({
    adminAuthedContext,
  }) => {
    const { page } = adminAuthedContext;
    await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '오신고된 글',
      reportCount: 2,
      author: {
        uid: 'other-uid',
        coupleId: 'other-couple',
        displayName: 'Other',
      },
    });

    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await admin.reportedTab.click();
    const card = admin.reportedCards.first();
    await admin.keepButton(card).click();

    // 신고 큐에서 사라짐 (reportCount=0)
    await expect(admin.reportedCards).toHaveCount(0);

    // 피드에는 남아 있음
    const community = new CommunityPage(page);
    await community.goto();
    await expect(community.userPostCards).toHaveCount(1);
    await expect(community.userPostCards.first()).toContainText('오신고된 글');
  });
});
