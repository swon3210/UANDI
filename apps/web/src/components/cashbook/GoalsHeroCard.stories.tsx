import type { Meta, StoryObj } from '@storybook/react';
import { GoalsHeroCard } from './GoalsHeroCard';

const meta: Meta<typeof GoalsHeroCard> = {
  title: 'Cashbook/GoalsHeroCard',
  component: GoalsHeroCard,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof GoalsHeroCard>;

export const Default: Story = {
  args: {
    totalIncome: 120000000,
    totalExpense: 30000000,
  },
};

export const NegativeNet: Story = {
  args: {
    totalIncome: 60000000,
    totalExpense: 68000000,
  },
};

export const Zero: Story = {
  args: {
    totalIncome: 0,
    totalExpense: 0,
  },
};

export const HighNet: Story = {
  args: {
    totalIncome: 200000000,
    totalExpense: 70000000,
  },
};
