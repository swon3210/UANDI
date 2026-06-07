import type { Meta, StoryObj } from '@storybook/react';
import { PredictionPromptList } from './PredictionPromptList';

const meta: Meta<typeof PredictionPromptList> = {
  title: 'Cashbook/Cashflow/PredictionPromptList',
  component: PredictionPromptList,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PredictionPromptList>;

const noop = () => {};

export const Default: Story = {
  args: {
    prompts: [
      {
        id: '1',
        type: 'expense',
        amount: 700000,
        category: '월세',
        description: '',
        source: 'calendar',
        date: new Date(2026, 5, 25),
      },
      {
        id: '2',
        type: 'expense',
        amount: 89000,
        category: '보험',
        description: '실손보험',
        source: 'auto',
        date: new Date(2026, 5, 25),
        recurrenceLabel: '매월 25일',
      },
    ],
    onConfirm: noop,
    onReject: noop,
    onEdit: noop,
  },
};

export const Empty: Story = {
  args: { prompts: [], onConfirm: noop, onReject: noop, onEdit: noop },
};
