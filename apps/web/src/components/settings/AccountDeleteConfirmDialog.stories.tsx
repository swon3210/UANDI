import type { Meta, StoryObj } from '@storybook/react';
import { AccountDeleteConfirmDialog } from './AccountDeleteConfirmDialog';

const meta: Meta<typeof AccountDeleteConfirmDialog> = {
  title: 'Settings/AccountDeleteConfirmDialog',
  component: AccountDeleteConfirmDialog,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof AccountDeleteConfirmDialog>;

export const Default: Story = {
  args: {
    isOpen: true,
    onConfirm: () => alert('탈퇴 확인'),
    onCancel: () => alert('취소'),
    isPending: false,
  },
};

export const Pending: Story = {
  args: {
    isOpen: true,
    onConfirm: () => {},
    onCancel: () => {},
    isPending: true,
  },
};
