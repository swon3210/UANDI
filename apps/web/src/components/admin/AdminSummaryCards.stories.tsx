import type { Meta, StoryObj } from '@storybook/react';
import { AdminSummaryCards } from './AdminSummaryCards';
import { SAMPLE_ADMIN_USERS } from './admin-fixtures';

const meta: Meta<typeof AdminSummaryCards> = {
  title: 'Admin/AdminSummaryCards',
  component: AdminSummaryCards,
  decorators: [
    (Story) => (
      <div className="max-w-5xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminSummaryCards>;

export const Default: Story = {
  args: { users: SAMPLE_ADMIN_USERS, now: '2026-11-11T00:00:00.000Z' },
};

/** 가입자가 없을 때 — 모두 0 */
export const Empty: Story = { args: { users: [], now: '2026-11-11T00:00:00.000Z' } };
