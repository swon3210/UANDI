import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { AppSidebarPage } from '../page-objects/AppSidebarPage';
import {
  createFeedbackAsUser,
  createTestUser,
  listFeedback,
  readFeedbackAsUser,
  seedFeedback,
  seedUserDocument,
} from '../helpers/emulator';

// 의견 보내기 — docs/pages/07-feedback.md

const EMAIL_1 = 'user1@test.com';
const ADMIN_EMAIL = 'admin@test.com'; // .env.test 의 ADMIN_EMAILS
const PASSWORD = 'testpassword123';
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function openFeedbackFromSettings(page: Page) {
  await page.goto('/settings');
  await page.getByTestId('settings-feedback').click();
  await page.waitForURL('**/settings/feedback');
  await expect(page.getByTestId('feedback-page')).toBeVisible();
}

async function signInAs(page: Page, email: string) {
  await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      await w.__auth.signOut();
      await w.__signInWithEmailAndPassword(w.__auth, email, password);
    },
    { email, password: PASSWORD }
  );
  // 커플 없는 계정은 / 에서 온보딩으로 가므로, 온보딩 도착을 로그인 전환 완료 신호로 쓴다.
  await page.goto('/');
  await page.waitForURL('**/onboarding', { timeout: 15000 });
}

test.describe('의견 보내기 (/settings/feedback)', () => {
  test('사이드바 footer의 「의견 보내기」로 들어갈 수 있다', async ({ authedPage }) => {
    const nav = new AppSidebarPage(authedPage);
    await nav.open();
    await nav.sidebar.getByTestId('sidebar-feedback-link').click();
    await authedPage.waitForURL('**/settings/feedback');
    await expect(authedPage.getByTestId('feedback-page')).toBeVisible();
  });

  test('유형을 고르지 않거나 내용이 10자 미만이면 오류를 보여주고 보내지 않는다', async ({
    authedPage,
  }) => {
    await openFeedbackFromSettings(authedPage);
    await authedPage.getByTestId('feedback-content').fill('짧아요');
    await authedPage.getByTestId('feedback-submit').click();

    await expect(authedPage.getByText('어떤 내용인지 골라 주세요')).toBeVisible();
    await expect(authedPage.getByText('10자 이상 적어 주세요')).toBeVisible();
    expect(await listFeedback()).toHaveLength(0);
  });

  test('연락 이메일 기본값은 로그인 이메일이고, 형식이 틀리면 오류를 보여준다', async ({
    authedPage,
  }) => {
    await openFeedbackFromSettings(authedPage);
    const email = authedPage.getByTestId('feedback-email');
    await expect(email).toHaveValue(EMAIL_1);

    await email.fill('not-an-email');
    await authedPage.getByTestId('feedback-type-idea').click();
    await authedPage.getByTestId('feedback-content').fill('다크 모드가 있으면 좋겠어요');
    await authedPage.getByTestId('feedback-submit').click();
    await expect(authedPage.getByText('이메일 형식을 확인해 주세요')).toBeVisible();
    expect(await listFeedback()).toHaveLength(0);
  });

  test('버그를 스크린샷과 함께 보내면 저장되고 이전 화면으로 돌아간다', async ({
    authedContext,
  }) => {
    const { page, uid } = authedContext;
    await openFeedbackFromSettings(page);

    await page.getByTestId('feedback-type-bug').click();
    await page
      .getByTestId('feedback-content')
      .fill('내역 화면에서 저장을 누르면 아무 반응이 없어요');
    await page.getByTestId('feedback-screenshot-input').setInputFiles({
      name: 'shot.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TINY_PNG_BASE64, 'base64'),
    });
    await expect(page.getByTestId('feedback-screenshot-preview')).toBeVisible();
    await page.getByTestId('feedback-submit').click();

    await expect(page.getByText('보내 주셔서 고마워요')).toBeVisible({ timeout: 15000 });
    await page.waitForURL(/\/settings$/);

    const saved = await listFeedback();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      uid,
      type: 'bug',
      content: '내역 화면에서 저장을 누르면 아무 반응이 없어요',
      contactEmail: EMAIL_1,
      status: 'new',
      platform: 'web',
    });
    expect(saved[0].screenshotPath).toMatch(new RegExp(`^feedback/${uid}/${saved[0].id}\\.`));
  });

  test('스크린샷 없이 보내면 screenshotPath는 null이고, 이메일을 비우면 contactEmail도 null이다', async ({
    authedPage,
  }) => {
    await openFeedbackFromSettings(authedPage);
    await authedPage.getByTestId('feedback-type-other').click();
    await authedPage.getByTestId('feedback-content').fill('앱 이름이 귀여워서 좋아요!');
    await authedPage.getByTestId('feedback-email').fill('');
    await authedPage.getByTestId('feedback-submit').click();
    await expect(authedPage.getByText('보내 주셔서 고마워요')).toBeVisible({ timeout: 15000 });

    await expect.poll(async () => (await listFeedback()).length).toBe(1);
    const [saved] = await listFeedback();
    expect(saved.type).toBe('other');
    expect(saved.screenshotPath).toBeNull();
    expect(saved.contactEmail).toBeNull();
  });

  test('규칙: 남의 uid로 만들기·처리 상태로 만들기·남의 피드백 읽기는 거부된다', async ({
    authedContext,
  }) => {
    const { uid } = authedContext;
    expect(
      await createFeedbackAsUser(EMAIL_1, PASSWORD, 'fb-other-uid', {
        uid: 'someone-else',
        status: 'new',
      })
    ).toBe(403);
    expect(
      await createFeedbackAsUser(EMAIL_1, PASSWORD, 'fb-resolved', { uid, status: 'resolved' })
    ).toBe(403);
    // 본인 uid + status=new 는 허용
    expect(await createFeedbackAsUser(EMAIL_1, PASSWORD, 'fb-ok', { uid, status: 'new' })).toBe(
      200
    );
    // 본인 문서라도 클라이언트는 읽을 수 없다(어드민 API만)
    expect(await readFeedbackAsUser(EMAIL_1, PASSWORD, 'fb-ok')).toBe(403);
  });
});

test.describe('어드민 피드백 탭', () => {
  test('허용 목록에 없는 사용자는 /api/admin/feedback 에서 403을 받는다', async ({
    authedPage,
  }) => {
    const status = await authedPage.evaluate(async () => {
      const w = window as any;
      const token = await w.__auth.currentUser.getIdToken();
      const res = await fetch('/api/admin/feedback', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.status;
    });
    expect(status).toBe(403);
  });

  test('최신순으로 보이고, 유형으로 거르고, 상태를 해결로 바꾸면 유지된다', async ({
    authedContext,
  }) => {
    const { page, uid } = authedContext;
    await seedFeedback('fb-old-bug', {
      uid,
      type: 'bug',
      content: '사진 업로드가 멈춰요',
      createdAt: new Date('2026-11-10T10:00:00Z'),
    });
    await seedFeedback('fb-new-idea', {
      uid,
      type: 'idea',
      content: '월간 리포트를 메일로 받고 싶어요',
      contactEmail: 'reply@test.com',
      createdAt: new Date('2026-11-12T10:00:00Z'),
    });

    const adminUid = await createTestUser(ADMIN_EMAIL, PASSWORD);
    await seedUserDocument(adminUid, ADMIN_EMAIL, null);
    await signInAs(page, ADMIN_EMAIL);

    await page.goto('/admin');
    await page.getByTestId('admin-tab-feedback').click();
    // 피드백 API는 사용자 목록 다음에 불린다(dev 서버 첫 컴파일 포함)
    await expect(page.getByTestId('admin-tab-feedback')).toContainText('신규 2', {
      timeout: 20000,
    });

    const cards = page.getByTestId('admin-feedback-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText('월간 리포트를 메일로 받고 싶어요');
    await expect(cards.first()).toContainText('reply@test.com');
    await expect(cards.first()).toContainText(EMAIL_1);
    await expect(cards.nth(1)).toContainText('사진 업로드가 멈춰요');

    // 유형 필터: 버그만
    await page.getByTestId('admin-feedback-type-filter').click();
    await page.getByRole('option', { name: '버그' }).click();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('사진 업로드가 멈춰요');

    // 상태를 해결로
    await cards.first().getByTestId('admin-feedback-status').click();
    await page.getByRole('option', { name: '해결' }).click();
    // 서버 반영 후 목록을 다시 받아 와야 바뀐다
    await expect(cards.first().getByTestId('admin-feedback-status')).toContainText('해결', {
      timeout: 15000,
    });

    await page.reload();
    await page.getByTestId('admin-tab-feedback').click({ timeout: 20000 });
    const bugCard = page
      .getByTestId('admin-feedback-card')
      .filter({ hasText: '사진 업로드가 멈춰요' });
    await expect(bugCard.getByTestId('admin-feedback-status')).toContainText('해결', {
      timeout: 20000,
    });
    // 신규 개수는 1로 줄어든다
    await expect(page.getByTestId('admin-tab-feedback')).toContainText('신규 1');
  });
});
