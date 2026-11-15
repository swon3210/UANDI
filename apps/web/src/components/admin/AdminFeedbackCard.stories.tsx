import type { Meta, StoryObj } from '@storybook/react';
import { AdminFeedbackCard } from './AdminFeedbackCard';
import {
  FEEDBACK_BUG_WITH_SCREENSHOT,
  FEEDBACK_DIFFERENT_CONTACT,
  FEEDBACK_IDEA_NO_SCREENSHOT,
  FEEDBACK_LONG_CONTENT,
} from './admin-feedback-fixtures';

const meta: Meta<typeof AdminFeedbackCard> = {
  title: 'Admin/AdminFeedbackCard',
  component: AdminFeedbackCard,
  args: { onStatusChange: () => {} },
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminFeedbackCard>;

/** 버그 + 스크린샷 + 안드로이드 앱 정보 */
export const 버그_스크린샷: Story = { args: { item: FEEDBACK_BUG_WITH_SCREENSHOT } };

/** 의견, 스크린샷 없음, 웹(앱 버전·직전 화면 없음) */
export const 의견_스크린샷_없음: Story = { args: { item: FEEDBACK_IDEA_NO_SCREENSHOT } };

/** 긴 내용 — 줄바꿈 유지, 카드가 늘어난다 */
export const 긴_내용: Story = { args: { item: FEEDBACK_LONG_CONTENT } };

/** 답장 이메일이 로그인 이메일(애플 비공개 릴레이)과 다를 때 따로 표시 */
export const 답장_이메일_다름: Story = { args: { item: FEEDBACK_DIFFERENT_CONTACT } };

/** 상태를 바꾸는 중 — 상태 선택 비활성 */
export const 상태_변경_중: Story = {
  args: { item: FEEDBACK_BUG_WITH_SCREENSHOT, statusPending: true },
};
