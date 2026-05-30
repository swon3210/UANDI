import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CommunityPage } from '../page-objects/CommunityPage';
import { seedCommunityPost } from '../helpers/emulator';

test.describe('커뮤니티 피드 — 읽기', () => {
  test('승인된 user 글이 카드에 작성자명과 본문이 함께 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '오늘 신랑이 처음으로 설거지를 했어요 🥹',
      author: { uid, coupleId, displayName: '민지' },
    });

    const community = new CommunityPage(page);
    await community.goto();

    await expect(community.userPostCards).toHaveCount(1);
    const card = community.userPostCards.first();
    await expect(card).toContainText('민지');
    await expect(card).toContainText('오늘 신랑이 처음으로 설거지를 했어요');
  });

  test('승인된 scraped 글의 원문 보기 링크는 새 탭으로 열린다', async ({ authedPage }) => {
    await seedCommunityPost({
      type: 'scraped',
      status: 'published',
      title: '신혼 첫 명절 후기',
      body: '명절에 다녀온 시댁 이야기...',
      source: {
        siteName: '결혼 매거진',
        url: 'https://example.com/newlywed-chuseok',
        ogImageUrl: 'https://example.com/og.jpg',
        sourceId: 'hash-abc-123',
      },
    });

    const community = new CommunityPage(authedPage);
    await community.goto();

    await expect(community.scrapedPostCards).toHaveCount(1);
    const card = community.scrapedPostCards.first();
    await expect(card).toContainText('신혼 첫 명절 후기');
    await expect(card).toContainText('결혼 매거진');

    const link = card.getByRole('link', { name: /원문/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('href', 'https://example.com/newlywed-chuseok');
  });

  test('pending 상태의 scraped 글은 피드에 보이지 않는다', async ({ authedPage }) => {
    await seedCommunityPost({
      type: 'scraped',
      status: 'pending',
      title: '아직 승인 안 된 글',
      source: {
        siteName: '어떤 사이트',
        url: 'https://example.com/pending',
        sourceId: 'hash-pending',
      },
    });

    const community = new CommunityPage(authedPage);
    await community.goto();

    await expect(community.emptyState).toBeVisible();
    await expect(community.postCards).toHaveCount(0);
  });

  test('hidden 상태의 글은 피드에 보이지 않는다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCommunityPost({
      type: 'user',
      status: 'hidden',
      body: '숨김 처리된 글',
      author: { uid, coupleId, displayName: '민지' },
    });

    const community = new CommunityPage(page);
    await community.goto();

    await expect(community.emptyState).toBeVisible();
    await expect(community.postCards).toHaveCount(0);
  });

  test('publishedAt 최신순으로 정렬된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    const older = new Date('2026-05-01T10:00:00Z').toISOString();
    const newer = new Date('2026-05-20T10:00:00Z').toISOString();

    await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '오래된 글 본문',
      publishedAt: older,
      author: { uid, coupleId, displayName: '민지' },
    });
    await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '최근 글 본문',
      publishedAt: newer,
      author: { uid, coupleId, displayName: '민지' },
    });

    const community = new CommunityPage(page);
    await community.goto();

    await expect(community.postCards).toHaveCount(2);
    await expect(community.postCards.nth(0)).toContainText('최근 글 본문');
    await expect(community.postCards.nth(1)).toContainText('오래된 글 본문');
  });
});
