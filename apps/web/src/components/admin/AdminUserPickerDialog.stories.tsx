import type { Meta, StoryObj } from '@storybook/react';
import { AdminUserPickerDialog } from './AdminUserPickerDialog';
import { SAMPLE_ADMIN_USERS } from './admin-fixtures';

const meta: Meta<typeof AdminUserPickerDialog> = {
  title: 'Admin/AdminUserPickerDialog',
  component: AdminUserPickerDialog,
  args: {
    isOpen: true,
    users: SAMPLE_ADMIN_USERS,
    initialSelectedUids: new Set(),
    onConfirm: (uids) => alert(`${uids.size}명 선택`),
    onCancel: () => alert('취소'),
  },
};

export default meta;
type Story = StoryObj<typeof AdminUserPickerDialog>;

/** 처음 연 상태 — 아무도 안 고름 */
export const Default: Story = {};

/** 이미 고른 대상이 있을 때 다시 연 상태 */
export const WithSelection: Story = {
  args: { initialSelectedUids: new Set([SAMPLE_ADMIN_USERS[0]!.uid, SAMPLE_ADMIN_USERS[1]!.uid]) },
};

/** 가입자가 많을 때 — 목록만 스크롤된다 */
export const ManyUsers: Story = {
  args: {
    users: Array.from({ length: 40 }, (_, i) => ({
      ...SAMPLE_ADMIN_USERS[i % SAMPLE_ADMIN_USERS.length]!,
      uid: `user-${i}`,
      email: `user${i}@example.com`,
      displayName: `사용자 ${i + 1}`,
    })),
  },
};

/** 가입자가 없을 때 */
export const Empty: Story = { args: { users: [] } };
