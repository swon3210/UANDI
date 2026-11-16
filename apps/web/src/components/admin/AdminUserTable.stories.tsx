import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AdminUserTable } from './AdminUserTable';
import { SAMPLE_ADMIN_USERS } from './admin-fixtures';

const meta: Meta<typeof AdminUserTable> = {
  title: 'Admin/AdminUserTable',
  component: AdminUserTable,
  decorators: [
    (Story) => (
      <div className="max-w-5xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminUserTable>;

/** 커플 연결·미연결·상대 대기·긴 이메일이 섞인 기본 상태 */
export const Default: Story = { args: { users: SAMPLE_ADMIN_USERS } };

/** 가입자가 없을 때 */
export const Empty: Story = { args: { users: [] } };

/** 공지 푸시 대상 고르기 — 체크박스 열 + 빠른 선택 */
export const Selectable: Story = {
  args: { users: SAMPLE_ADMIN_USERS },
  render: function SelectableStory(args) {
    const [selected, setSelected] = useState<Set<string>>(
      () => new Set([SAMPLE_ADMIN_USERS[0]!.uid])
    );
    return (
      <AdminUserTable {...args} selection={{ selectedUids: selected, onChange: setSelected }} />
    );
  },
};
