import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BudgetAlertBanner, type BudgetAlert } from './BudgetAlertBanner';

const meta: Meta<typeof BudgetAlertBanner> = {
  title: 'Cashbook/BudgetAlertBanner',
  component: BudgetAlertBanner,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BudgetAlertBanner>;

const noop = () => {};

export const Empty: Story = {
  args: {
    alerts: [],
    onDismiss: noop,
  },
};

export const SingleWarn80: Story = {
  args: {
    alerts: [
      {
        key: 'cat-food-warn80',
        scope: 'category',
        label: '식비',
        threshold: 'warn80',
      },
    ],
    onDismiss: noop,
  },
};

export const SingleOver100: Story = {
  args: {
    alerts: [
      {
        key: 'cat-food-over100',
        scope: 'category',
        label: '식비',
        threshold: 'over100',
      },
    ],
    onDismiss: noop,
  },
};

export const SingleOver120: Story = {
  args: {
    alerts: [
      {
        key: 'cat-food-over120',
        scope: 'category',
        label: '식비',
        threshold: 'over120',
      },
    ],
    onDismiss: noop,
  },
};

export const TotalAndCategory: Story = {
  args: {
    alerts: [
      {
        key: 'total-warn80',
        scope: 'total',
        label: '전체',
        threshold: 'warn80',
      },
      {
        key: 'cat-social-over100',
        scope: 'category',
        label: '사회생활',
        threshold: 'over100',
      },
    ],
    onDismiss: noop,
  },
};

export const MultipleSeverity: Story = {
  args: {
    alerts: [
      {
        key: 'cat-food-over120',
        scope: 'category',
        label: '식비',
        threshold: 'over120',
      },
      {
        key: 'cat-social-over100',
        scope: 'category',
        label: '사회생활(나)',
        threshold: 'over100',
      },
      {
        key: 'cat-transport-warn80',
        scope: 'category',
        label: '교통',
        threshold: 'warn80',
      },
    ],
    onDismiss: noop,
  },
};

function InteractiveDemo() {
  const initial: BudgetAlert[] = [
    {
      key: 'total-over100',
      scope: 'total',
      label: '전체',
      threshold: 'over100',
    },
    {
      key: 'cat-food-over120',
      scope: 'category',
      label: '식비',
      threshold: 'over120',
    },
    {
      key: 'cat-transport-warn80',
      scope: 'category',
      label: '교통',
      threshold: 'warn80',
    },
  ];
  const [alerts, setAlerts] = useState(initial);
  return (
    <BudgetAlertBanner
      alerts={alerts}
      onDismiss={(key) => setAlerts((prev) => prev.filter((a) => a.key !== key))}
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
