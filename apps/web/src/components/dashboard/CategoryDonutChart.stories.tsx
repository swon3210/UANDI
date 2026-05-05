import type { Meta, StoryObj } from '@storybook/react';
import { CategoryDonutChart } from './CategoryDonutChart';
import type { CategorySlice } from '@/hooks/useDashboardData';

const meta: Meta<typeof CategoryDonutChart> = {
  title: 'Dashboard/CategoryDonutChart',
  component: CategoryDonutChart,
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

type Story = StoryObj<typeof CategoryDonutChart>;

const single = (): CategorySlice[] => [
  { category: '식비', amount: 40000, color: '#E8837A' },
];

const multiple = (): CategorySlice[] => [
  { category: '식비', amount: 320_000, color: '#E8837A' },
  { category: '교통', amount: 80_000, color: '#F9B2AC' },
  { category: '쇼핑', amount: 120_000, color: '#BE4B44' },
  { category: '월세', amount: 700_000, color: '#D8635A' },
  { category: '여가', amount: 60_000, color: '#98D9BF' },
];

export const Single: Story = {
  render: () => <CategoryDonutChart data={single()} />,
};

export const Multiple: Story = {
  render: () => <CategoryDonutChart data={multiple()} />,
};

export const Empty: Story = {
  render: () => <CategoryDonutChart data={[]} />,
};
