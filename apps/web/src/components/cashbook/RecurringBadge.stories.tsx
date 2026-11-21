import type { Meta, StoryObj } from '@storybook/react';
import { RecurringBadge } from './RecurringBadge';

const meta: Meta<typeof RecurringBadge> = {
  title: 'Cashbook/RecurringBadge',
  component: RecurringBadge,
};

export default meta;
type Story = StoryObj<typeof RecurringBadge>;

export const DayOfMonth: Story = {
  args: {
    schedule: { enabled: true, kind: 'dayOfMonth', dayOfMonth: 25 },
  },
};

export const DayOfMonthWithLead: Story = {
  args: {
    schedule: { enabled: true, kind: 'dayOfMonth', dayOfMonth: 1, leadDays: 3 },
  },
};

export const NthWeekday: Story = {
  args: {
    schedule: { enabled: true, kind: 'nthWeekday', week: 2, weekday: 3 },
  },
};

export const LastWeek: Story = {
  args: {
    schedule: { enabled: true, kind: 'nthWeekday', week: -1, weekday: 5 },
  },
};

// enabled=false면 아무것도 렌더하지 않음 (null)
export const DisabledRendersNothing: Story = {
  args: {
    schedule: { enabled: false, kind: 'dayOfMonth', dayOfMonth: 25 },
  },
};

// 발생일 자동 기록이 켜진 카테고리: 주기 뒤에 "· 자동 기록" 표식.
export const WithAutoRecord: Story = {
  args: {
    schedule: {
      enabled: true,
      kind: 'dayOfMonth',
      dayOfMonth: 25,
      expectedAmount: 800000,
      autoRecord: true,
      payerUid: 'me',
    },
  },
};
