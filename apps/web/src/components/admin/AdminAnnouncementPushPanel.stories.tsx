import type { Meta, StoryObj } from '@storybook/react';
import { AdminAnnouncementPushPanel } from './AdminAnnouncementPushPanel';
import {
  SAMPLE_PUSH_ANNOUNCEMENTS,
  SAMPLE_PUSH_LOGS,
  SAMPLE_PUSH_PREVIEW,
} from './admin-push-fixtures';

const meta: Meta<typeof AdminAnnouncementPushPanel> = {
  title: 'Admin/AdminAnnouncementPushPanel',
  component: AdminAnnouncementPushPanel,
  decorators: [
    (Story) => (
      <div className="max-w-5xl p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    announcements: SAMPLE_PUSH_ANNOUNCEMENTS,
    announcementId: SAMPLE_PUSH_ANNOUNCEMENTS[0]!.id,
    onAnnouncementChange: () => {},
    selectedCount: 12,
    onPickUsers: () => alert('대상 고르기'),
    preview: SAMPLE_PUSH_PREVIEW,
    previewLoading: false,
    previewError: null,
    sending: false,
    onSend: () => alert('보내기'),
    logs: SAMPLE_PUSH_LOGS,
    logsLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof AdminAnnouncementPushPanel>;

/** 공지·대상을 고르고 미리보기까지 나온 상태 */
export const Ready: Story = {};

/** 처음 연 상태 — 공지도 대상도 없음 */
export const Empty: Story = {
  args: { announcementId: null, selectedCount: 0, preview: null, logs: [] },
};

/** 공지는 골랐지만 대상을 안 고름 */
export const NoTarget: Story = {
  args: { selectedCount: 0, preview: null },
};

/** 미리보기 불러오는 중 */
export const PreviewLoading: Story = {
  args: { preview: null, previewLoading: true },
};

/** 모두 제외돼 보낼 사람이 없음 — 보내기 비활성 */
export const NothingToSend: Story = {
  args: {
    selectedCount: 3,
    preview: {
      targetCount: 3,
      alreadySentCount: 2,
      optedOutCount: 1,
      noTokenCount: 0,
      eligibleCount: 0,
    },
  },
};

/** 보내는 중 */
export const Sending: Story = { args: { sending: true } };

/** 미리보기 실패 */
export const PreviewError: Story = {
  args: { preview: null, previewError: '대상을 확인하지 못했어요' },
};
