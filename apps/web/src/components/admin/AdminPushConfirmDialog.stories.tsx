import type { Meta, StoryObj } from '@storybook/react';
import { AdminPushConfirmDialog } from './AdminPushConfirmDialog';

const meta: Meta<typeof AdminPushConfirmDialog> = {
  title: 'Admin/AdminPushConfirmDialog',
  component: AdminPushConfirmDialog,
  args: {
    isOpen: true,
    announcementTitle: '초대 코드에 영문을 입력할 수 없던 문제를 고쳤어요',
    count: 6,
    isNight: false,
    onConfirm: () => alert('보내기'),
    onCancel: () => alert('취소'),
  },
};

export default meta;
type Story = StoryObj<typeof AdminPushConfirmDialog>;

/** 낮 시간 */
export const Default: Story = {};

/** 21시~8시 — 야간 경고 */
export const Night: Story = { args: { isNight: true } };
