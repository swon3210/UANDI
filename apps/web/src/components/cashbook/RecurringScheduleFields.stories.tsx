import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  RecurringScheduleFields,
  type RecurringScheduleValue,
} from './RecurringScheduleFields';

const meta: Meta<typeof RecurringScheduleFields> = {
  title: 'Cashbook/RecurringScheduleFields',
  component: RecurringScheduleFields,
  decorators: [
    (Story) => (
      <div className="max-w-sm rounded-lg border p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecurringScheduleFields>;

function Interactive({
  initial,
  variant,
}: {
  initial: RecurringScheduleValue;
  variant?: 'income' | 'expense';
}) {
  const [value, setValue] = useState<RecurringScheduleValue>(initial);
  return <RecurringScheduleFields value={value} onChange={setValue} variant={variant} />;
}

export const Disabled: Story = {
  render: () => <Interactive initial={{ enabled: false, kind: 'dayOfMonth' }} />,
};

export const DayOfMonth: Story = {
  render: () => (
    <Interactive
      initial={{ enabled: true, kind: 'dayOfMonth', dayOfMonth: 25, expectedAmount: 800000 }}
    />
  ),
};

export const NthWeekday: Story = {
  render: () => (
    <Interactive
      initial={{ enabled: true, kind: 'nthWeekday', week: 2, weekday: 3, leadDays: 3 }}
    />
  ),
};

export const LastWeek: Story = {
  render: () => (
    <Interactive initial={{ enabled: true, kind: 'nthWeekday', week: -1, weekday: 5 }} />
  ),
};

export const IncomeVariant: Story = {
  render: () => (
    <Interactive
      variant="income"
      initial={{ enabled: true, kind: 'dayOfMonth', dayOfMonth: 10 }}
    />
  ),
};
