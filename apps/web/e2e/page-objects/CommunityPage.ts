import { type Page, type Locator } from '@playwright/test';

export class CommunityPage {
  readonly page: Page;
  readonly header: Locator;
  readonly emptyState: Locator;
  readonly spaceRoot: Locator;

  readonly postCards: Locator;
  readonly userPostCards: Locator;
  readonly scrapedPostCards: Locator;

  // 글쓰기
  readonly writeButton: Locator;
  readonly composer: Locator;
  readonly composerBody: Locator;
  readonly composerImageInput: Locator;
  readonly composerSubmit: Locator;
  readonly composerEditSubmit: Locator;
  readonly composerImagePreview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('community-header');
    this.emptyState = page.getByTestId('community-empty');
    this.spaceRoot = page.locator('[data-space="community"]');
    this.postCards = page.getByTestId('community-post-card');
    this.userPostCards = page.locator('[data-testid="community-post-card"][data-type="user"]');
    this.scrapedPostCards = page.locator(
      '[data-testid="community-post-card"][data-type="scraped"]'
    );

    this.writeButton = page.getByTestId('community-write');
    this.composer = page.getByTestId('community-composer');
    this.composerBody = this.composer.getByTestId('composer-body');
    this.composerImageInput = this.composer.getByTestId('composer-image-input');
    this.composerImagePreview = this.composer.getByTestId('composer-image-preview');
    this.composerSubmit = this.composer.getByRole('button', { name: '올리기' });
    this.composerEditSubmit = this.composer.getByRole('button', { name: '수정하기' });
  }

  /** 본인 글 카드의 [⋯] 메뉴를 연다 */
  async openActionMenu(card: Locator) {
    await card.getByRole('button', { name: '액션 메뉴' }).click();
  }

  deleteMenuItem(): Locator {
    return this.page.getByRole('menuitem', { name: '삭제하기' });
  }

  editMenuItem(): Locator {
    return this.page.getByRole('menuitem', { name: '수정하기' });
  }

  reportMenuItem(): Locator {
    return this.page.getByRole('menuitem', { name: '신고하기' });
  }

  /** 삭제 확인 모달의 확인 버튼 */
  confirmDeleteButton(): Locator {
    return this.page.getByRole('button', { name: '삭제' });
  }

  /** 신고 다이얼로그 */
  reportDialog(): Locator {
    return this.page.getByTestId('community-report-dialog');
  }

  /** 신고 사유 라디오 (스팸/부적절/저작권/기타) */
  reportReasonOption(label: string): Locator {
    return this.reportDialog().getByRole('radio', { name: label });
  }

  reportSubmitButton(): Locator {
    return this.reportDialog().getByRole('button', { name: '신고' });
  }

  reportCancelButton(): Locator {
    return this.reportDialog().getByRole('button', { name: '취소' });
  }

  async goto() {
    await this.page.goto('/community');
  }

  /** 카드 내부에서 작성자/제목/본문/링크 등을 찾는 헬퍼 */
  cardByText(text: string): Locator {
    return this.postCards.filter({ hasText: text });
  }
}
