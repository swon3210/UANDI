import type { Meta, StoryObj } from '@storybook/react';
import { GoalCategoryCard } from './GoalCategoryCard';
import { GOAL_CATEGORY_BY_KEY } from '@/constants/goal-categories';

const meta: Meta<typeof GoalCategoryCard> = {
  title: 'Cashbook/GoalCategoryCard',
  component: GoalCategoryCard,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof GoalCategoryCard>;

export const Income: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.income,
    goal: 120000000,
    actual: 104780000,
    itemCount: 3,
    onSelect: () => {},
  },
};

export const Expense: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.expense,
    goal: 24000000,
    actual: 1800000,
    itemCount: 5,
    onSelect: () => {},
  },
};

export const Investment: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.investment,
    goal: 30000000,
    actual: 0,
    itemCount: 2,
    onSelect: () => {},
  },
};

export const Flex: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.flex,
    goal: 6000000,
    actual: 1200000,
    itemCount: 2,
    onSelect: () => {},
  },
};

export const NoActual: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.income,
    goal: 60000000,
    itemCount: 2,
    onSelect: () => {},
  },
};

export const ZeroGoal: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.expense,
    goal: 0,
    actual: 0,
    itemCount: 0,
    onSelect: () => {},
  },
};

export const OverAchieved: Story = {
  args: {
    theme: GOAL_CATEGORY_BY_KEY.expense,
    goal: 24000000,
    actual: 30000000,
    itemCount: 5,
    onSelect: () => {},
  },
};
