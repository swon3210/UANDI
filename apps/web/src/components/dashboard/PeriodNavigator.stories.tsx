import type { Meta, StoryObj } from '@storybook/react';
import { PeriodNavigator } from './PeriodNavigator';

const meta: Meta<typeof PeriodNavigator> = {
  title: 'Dashboard/PeriodNavigator',
  component: PeriodNavigator,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PeriodNavigator>;

const noop = () => {};

export const CurrentMonth: Story = {
  render: () => (
    <PeriodNavigator label="2026년 5월" canGoNext={false} onPrev={noop} onNext={noop} />
  ),
};

export const PastMonth: Story = {
  render: () => (
    <PeriodNavigator label="2026년 4월" canGoNext={true} onPrev={noop} onNext={noop} />
  ),
};

export const Weekly: Story = {
  render: () => (
    <PeriodNavigator label="5월 4일 ~ 10일" canGoNext={false} onPrev={noop} onNext={noop} />
  ),
};

export const Yearly: Story = {
  render: () => (
    <PeriodNavigator label="2026년" canGoNext={false} onPrev={noop} onNext={noop} />
  ),
};
