import type { Meta, StoryObj } from '@storybook/react';
import { PreviousYearSuggestion } from './PreviousYearSuggestion';

const meta: Meta<typeof PreviousYearSuggestion> = {
  title: 'Cashbook/PreviousYearSuggestion',
  component: PreviousYearSuggestion,
};

export default meta;
type Story = StoryObj<typeof PreviousYearSuggestion>;

export const Default: Story = {
  args: {
    categoryName: '인센티브',
    previousAmount: 4500000,
    onApply: () => {},
  },
};

export const SmallAmount: Story = {
  args: {
    categoryName: '부업',
    previousAmount: 500000,
    onApply: () => {},
  },
};

export const LargeAmount: Story = {
  args: {
    categoryName: '정기급여',
    previousAmount: 42000000,
    onApply: () => {},
  },
};
