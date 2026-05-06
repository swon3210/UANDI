import type { Meta, StoryObj } from '@storybook/react';
import { GoalDetailHeader } from './GoalDetailHeader';
import { GOAL_CATEGORY_BY_KEY } from '@/constants/goal-categories';

const meta: Meta<typeof GoalDetailHeader> = {
  title: 'Cashbook/GoalDetailHeader',
  component: GoalDetailHeader,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof GoalDetailHeader>;

export const Income: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.income,
    itemsTotal: 120000000,
    actual: 104780000,
  },
};

export const Expense: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.expense,
    itemsTotal: 24000000,
    actual: 18600000,
  },
};

export const Investment: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.investment,
    itemsTotal: 30000000,
  },
};

export const Flex: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.flex,
    itemsTotal: 6000000,
    actual: 4200000,
  },
};

export const ZeroItems: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.expense,
    itemsTotal: 0,
    actual: 0,
  },
};
