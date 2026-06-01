import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CommunityPage } from '../page-objects/CommunityPage';
import { seedCommunityPost, seedCommunityReport } from '../helpers/emulator';

test.describe('커뮤니티 신고·자동 숨김', () => {
  test('타인 글 카드의 액션 메뉴에는 "신고하기"만 노출된다 (삭제 메뉴 없음)', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid2, coupleId } = twoUserAuthedContext;
    // 타인(uid2)이 쓴 글
    await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '타인이 쓴 글',
      author: { uid: uid2, coupleId, displayName: 'User 2' },
    });

    const community = new CommunityPage(page);
    await community.goto();
    const card = community.userPostCards.first();
    await expect(card).toBeVisible();

    await community.openActionMenu(card);
    await expect(community.reportMenuItem()).toBeVisible();
    await expect(community.deleteMenuItem()).toHaveCount(0);
  });

  test('타인 글을 신고하면 다이얼로그가 열리고 사유 선택 후 제출하면 토스트가 뜬다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid2, coupleId } = twoUserAuthedContext;
    await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '신고 대상 글',
      author: { uid: uid2, coupleId, displayName: 'User 2' },
    });

    const community = new CommunityPage(page);
    await community.goto();
    const card = community.userPostCards.first();
    await community.openActionMenu(card);
    await community.reportMenuItem().click();

    await expect(community.reportDialog()).toBeVisible();
    await community.reportReasonOption('부적절').click();
    await community.reportSubmitButton().click();

    await expect(community.reportDialog()).toBeHidden();
    await expect(page.getByText('신고가 접수됐어요')).toBeVisible();
  });

  test('같은 글에 같은 유저가 두 번째 신고를 시도하면 차단된다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    const postId = await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '이미 신고한 글',
      author: { uid: uid2, coupleId, displayName: 'User 2' },
    });
    // uid1(로그인 유저)이 이미 한 번 신고함
    await seedCommunityReport(postId, uid1, 'spam');

    const community = new CommunityPage(page);
    await community.goto();
    const card = community.userPostCards.first();
    await community.openActionMenu(card);
    await community.reportMenuItem().click();
    await community.reportReasonOption('부적절').click();
    await community.reportSubmitButton().click();

    await expect(page.getByText('이미 신고한 글이에요')).toBeVisible();
  });

  test('신고 3건이 누적되면 자동으로 숨겨져 피드에서 사라진다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid2, coupleId } = twoUserAuthedContext;
    const postId = await seedCommunityPost({
      type: 'user',
      status: 'published',
      body: '곧 자동 숨김될 글',
      author: { uid: uid2, coupleId, displayName: 'User 2' },
    });
    // 3건 신고 시드 (Cloud Function이 reportCount를 3으로 올리고 status='hidden' 처리)
    await seedCommunityReport(postId, 'reporter-uid-1', 'spam');
    await seedCommunityReport(postId, 'reporter-uid-2', 'inappropriate');
    await seedCommunityReport(postId, 'reporter-uid-3', 'copyright');

    // Functions가 비동기로 처리되므로 잠시 폴링하며 피드 새로고침
    const community = new CommunityPage(page);
    await community.goto();
    await expect
      .poll(
        async () => {
          await community.page.reload();
          return await community.postCards.count();
        },
        { timeout: 10000, intervals: [500, 1000, 2000] }
      )
      .toBe(0);
    await expect(community.emptyState).toBeVisible();
  });
});
