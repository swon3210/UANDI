import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CommunityPage } from '../page-objects/CommunityPage';
import { seedCommunityPost } from '../helpers/emulator';

// 1x1 투명 PNG (84 bytes) — Playwright setInputFiles로 메모리에서 첨부
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

test.describe('커뮤니티 글쓰기·삭제·상세', () => {
  test.describe('글쓰기', () => {
    test('헤더의 글쓰기 버튼을 누르면 글쓰기 시트가 열린다', async ({ authedPage }) => {
      const community = new CommunityPage(authedPage);
      await community.goto();
      await community.writeButton.click();
      await expect(community.composer).toBeVisible();
      await expect(community.composerSubmit).toBeVisible();
    });

    test('본문이 비어 있으면 올리기 버튼이 비활성화된다', async ({ authedPage }) => {
      const community = new CommunityPage(authedPage);
      await community.goto();
      await community.writeButton.click();
      await expect(community.composerSubmit).toBeDisabled();
    });

    test('본문만 작성하고 올리면 피드 최상단에 본인 글이 노출된다', async ({ authedPage }) => {
      const community = new CommunityPage(authedPage);
      await community.goto();
      await community.writeButton.click();
      await community.composerBody.fill('오늘 신랑이 처음으로 설거지를 했어요 🥹');
      await community.composerSubmit.click();

      // 시트가 닫히고 피드에 카드가 보인다
      await expect(community.composer).toBeHidden();
      await expect(community.userPostCards).toHaveCount(1);
      await expect(community.userPostCards.first()).toContainText(
        '오늘 신랑이 처음으로 설거지를 했어요'
      );
    });

    test('이미지를 첨부해 올리면 카드에 이미지가 표시된다', async ({ authedPage }) => {
      const community = new CommunityPage(authedPage);
      await community.goto();
      await community.writeButton.click();

      await community.composerImageInput.setInputFiles({
        name: 'photo.png',
        mimeType: 'image/png',
        buffer: PNG_1X1,
      });
      // 미리보기 노출
      await expect(community.composerImagePreview).toBeVisible();

      await community.composerBody.fill('오늘 만든 우리집 떡볶이 🍜');
      await community.composerSubmit.click();

      await expect(community.composer).toBeHidden();
      const card = community.userPostCards.first();
      await expect(card).toBeVisible();
      // 본문에 첨부 이미지가 함께 렌더 (alt=""인 img 1장 이상)
      await expect(card.locator('img')).toHaveCount(1);
    });
  });

  test.describe('삭제', () => {
    test('본인 글의 액션 메뉴에서 삭제하면 피드에서 사라진다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedCommunityPost({
        type: 'user',
        status: 'published',
        body: '곧 지워질 글',
        author: { uid, coupleId, displayName: '민지' },
      });

      const community = new CommunityPage(page);
      await community.goto();
      const card = community.userPostCards.first();
      await expect(card).toBeVisible();

      await community.openActionMenu(card);
      await community.deleteMenuItem().click();
      await community.confirmDeleteButton().click();

      await expect(community.postCards).toHaveCount(0);
      await expect(community.emptyState).toBeVisible();
    });
  });

  test.describe('수정', () => {
    test('본인 글의 액션 메뉴에 수정하기가 노출된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedCommunityPost({
        type: 'user',
        status: 'published',
        body: '수정 전 본문',
        author: { uid, coupleId, displayName: '민지' },
      });

      const community = new CommunityPage(page);
      await community.goto();
      const card = community.userPostCards.first();
      await expect(card).toBeVisible();

      await community.openActionMenu(card);
      await expect(community.editMenuItem()).toBeVisible();
      await expect(community.deleteMenuItem()).toBeVisible();
    });

    test('본인 글을 수정하면 카드에 새 본문과 수정됨 마커가 노출된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedCommunityPost({
        type: 'user',
        status: 'published',
        body: '수정 전 본문',
        author: { uid, coupleId, displayName: '민지' },
      });

      const community = new CommunityPage(page);
      await community.goto();
      const card = community.userPostCards.first();
      await expect(card).toBeVisible();

      await community.openActionMenu(card);
      await community.editMenuItem().click();

      // 편집 모드: 기존 본문이 채워진 채로 시트가 열린다
      await expect(community.composer).toBeVisible();
      await expect(community.composerBody).toHaveValue('수정 전 본문');

      await community.composerBody.fill('수정 후 본문 🎉');
      await community.composerEditSubmit.click();

      await expect(community.composer).toBeHidden();
      const updated = community.userPostCards.first();
      await expect(updated).toContainText('수정 후 본문');
      await expect(updated).toContainText('수정됨');
    });

    test('타인 글에는 수정하기가 노출되지 않는다', async ({ authedContext }) => {
      const { page } = authedContext;
      await seedCommunityPost({
        type: 'user',
        status: 'published',
        body: '다른 사람 글',
        author: { uid: 'someone-else', coupleId: 'other-couple', displayName: '다른사람' },
      });

      const community = new CommunityPage(page);
      await community.goto();
      const card = community.userPostCards.first();
      await expect(card).toBeVisible();

      await community.openActionMenu(card);
      await expect(community.editMenuItem()).toHaveCount(0);
      await expect(community.reportMenuItem()).toBeVisible();
    });
  });

  test.describe('상세 페이지', () => {
    test('본인 글 상세 페이지에서 작성자와 본문이 전부 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const postId = await seedCommunityPost({
        type: 'user',
        status: 'published',
        body: '본인 글 상세에서 전부 보이는지 확인',
        author: { uid, coupleId, displayName: '민지' },
      });

      await page.goto(`/community/${postId}`);
      await expect(page.getByTestId('community-post-detail')).toBeVisible();
      await expect(page.getByTestId('community-post-detail')).toContainText('민지');
      await expect(page.getByTestId('community-post-detail')).toContainText(
        '본인 글 상세에서 전부 보이는지 확인'
      );
    });

    test('스크랩 글의 상세 경로 접근 시 404가 표시된다', async ({ authedPage }) => {
      const postId = await seedCommunityPost({
        type: 'scraped',
        status: 'published',
        title: '스크랩 글',
        source: {
          siteName: '어떤 사이트',
          url: 'https://example.com/article',
          sourceId: 'hash-x',
        },
      });

      const response = await authedPage.goto(`/community/${postId}`);
      // Next 404 라우트는 200(서버 컴포넌트) 또는 404 응답 모두 가능 — UI 검증으로 확정한다.
      expect([200, 404]).toContain(response?.status() ?? 404);
      await expect(authedPage.getByTestId('community-post-detail')).toHaveCount(0);
      // Next 기본 404 UI 또는 한글 안내가 노출
      await expect(authedPage.locator('body')).toContainText(/404|찾을 수 없|This page could not be found/);
    });
  });
});
