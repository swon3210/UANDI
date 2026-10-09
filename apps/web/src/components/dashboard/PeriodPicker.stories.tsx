import type { Meta, StoryObj } from '@storybook/react';
import dayjs from 'dayjs';
import { PeriodPicker } from './PeriodPicker';

const meta: Meta<typeof PeriodPicker> = {
  title: 'Dashboard/PeriodPicker',
  component: PeriodPicker,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PeriodPicker>;

const today = dayjs('2026-10-09');
const noop = () => {};

export const Weekly: Story = {
  render: () => (
    <PeriodPicker kind="weekly" value={dayjs('2026-09-15')} today={today} onSelect={noop} />
  ),
};

export const WeeklyCurrentMonth: Story = {
  render: () => <PeriodPicker kind="weekly" value={today} today={today} onSelect={noop} />,
};

export const Monthly: Story = {
  render: () => (
    <PeriodPicker kind="monthly" value={dayjs('2026-03-01')} today={today} onSelect={noop} />
  ),
};

export const MonthlyPastYear: Story = {
  render: () => (
    <PeriodPicker kind="monthly" value={dayjs('2024-07-01')} today={today} onSelect={noop} />
  ),
};

export const Yearly: Story = {
  render: () => (
    <PeriodPicker kind="yearly" value={dayjs('2025-01-01')} today={today} onSelect={noop} />
  ),
};
