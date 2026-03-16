import type { Meta, StoryObj } from '@storybook/react';
import { WeeklyCategoryBreakdown } from './WeeklyCategoryBreakdown';

const meta: Meta<typeof WeeklyCategoryBreakdown> = {
  title: 'Cashbook/WeeklyCategoryBreakdown',
  component: WeeklyCategoryBreakdown,
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
type Story = StoryObj<typeof WeeklyCategoryBreakdown>;

export const Default: Story = {
  args: {
    categories: [
      { categoryName: '식비', icon: 'bowl_food', total: 230000 },
      { categoryName: '데이트', icon: 'heart', total: 120000 },
      { categoryName: '소모품', icon: 'shopping_bag', total: 85000 },
      { categoryName: '교통', icon: 'bus', total: 45000 },
    ],
  },
};

export const SingleCategory: Story = {
  args: {
    categories: [{ categoryName: '식비', icon: 'bowl_food', total: 150000 }],
  },
};

export const Empty: Story = {
  args: {
    categories: [],
  },
};
