import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CommunityPage } from '../page-objects/CommunityPage';
import { CommunityAdminPage } from '../page-objects/CommunityAdminPage';
import { seedCommunitySource } from '../helpers/emulator';

// 회귀 방지: 크롤러가 og:image를 enclosure 하나로만 해석해 네이버 등에서 미리보기가
// 비던 버그. 이제 (A) RSS media/본문 img → (B) 원문 HTML og:image 폴백 순으로 해석한다.
test.describe('커뮤니티 OG 이미지 추출 (크롤 → 승인 → 피드)', () => {
  test('RSS media 이미지와 원문 og:image 폴백이 모두 피드 카드에 노출된다', async ({
    adminAuthedContext,
    baseURL,
  }) => {
    const { page } = adminAuthedContext;
    // 크롤 라우트는 같은 Next 서버에서 돌므로 public 픽스처를 자기 자신이 fetch한다.
    await seedCommunitySource({
      siteName: 'OG 테스트 피드',
      feedUrl: `${baseURL}/test-fixtures/og-feed.xml`,
      enabled: true,
    });

    // 크롤 실행 → 승인 대기 2건 (RSS media 1건 + HTML 폴백 1건)
    const admin = new CommunityAdminPage(page);
    await admin.goto();
    await admin.sourcesTab.click();
    await admin.crawlNowButton.click();

    await admin.pendingTab.click();
    await expect(admin.pendingCards).toHaveCount(2);

    // 둘 다 승인 → status=published, 피드 노출
    await admin.approveButton(admin.pendingCards.first()).click();
    await expect(admin.pendingCards).toHaveCount(1);
    await admin.approveButton(admin.pendingCards.first()).click();
    await expect(admin.pendingCards).toHaveCount(0);

    // 피드에서 두 스크랩 카드 모두 og 이미지를 렌더한다
    const community = new CommunityPage(page);
    await community.goto();
    await expect(community.scrapedPostCards).toHaveCount(2);

    // (A) RSS media:content → 피드 URL을 그대로 저장·표시
    const mediaCard = community.cardByText('RSS 대표 이미지 글');
    await expect(mediaCard.locator('img')).toHaveAttribute(
      'src',
      `${baseURL}/test-fixtures/og-media.jpg`
    );

    // (B) RSS에 이미지가 없어 원문 HTML의 og:image(상대경로)를 절대화해 저장·표시
    const fallbackCard = community.cardByText('OG 폴백 이미지 글');
    await expect(fallbackCard.locator('img')).toHaveAttribute(
      'src',
      `${baseURL}/test-fixtures/og-html.jpg`
    );
  });
});
