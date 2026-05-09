import type { Meta, StoryObj } from '@storybook/react';
import { BulkEditSummaryBar } from './BulkEditSummaryBar';

const meta: Meta<typeof BulkEditSummaryBar> = {
  title: 'Cashbook/PlanBulkEdit/BulkEditSummaryBar',
  component: BulkEditSummaryBar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-[280px] bg-stone-50">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BulkEditSummaryBar>;

const baseTotals = { income: 60_000_000, expense: 36_000_000, flex: 7_200_000 };

export const NoChanges: Story = {
  args: {
    totalsBefore: baseTotals,
    totalsAfter: baseTotals,
    validation: {
      ok: true,
      deficit: -16_800_000,
      totals: baseTotals,
    },
    changedCount: 0,
    saving: false,
    onSave: () => {},
    onResetAll: () => {},
  },
};

export const ValidPass: Story = {
  args: {
    totalsBefore: baseTotals,
    totalsAfter: { income: 62_000_000, expense: 35_000_000, flex: 7_200_000 },
    validation: {
      ok: true,
      deficit: -19_800_000,
      totals: { income: 62_000_000, expense: 35_000_000, flex: 7_200_000 },
    },
    changedCount: 3,
    saving: false,
    onSave: () => {},
    onResetAll: () => {},
  },
};

export const ValidationFail: Story = {
  args: {
    totalsBefore: baseTotals,
    totalsAfter: { income: 60_000_000, expense: 50_000_000, flex: 14_000_000 },
    validation: {
      ok: false,
      deficit: 4_000_000,
      totals: { income: 60_000_000, expense: 50_000_000, flex: 14_000_000 },
    },
    changedCount: 5,
    saving: false,
    onSave: () => {},
    onResetAll: () => {},
  },
};

export const Saving: Story = {
  args: {
    totalsBefore: baseTotals,
    totalsAfter: { income: 62_000_000, expense: 35_000_000, flex: 7_200_000 },
    validation: {
      ok: true,
      deficit: -19_800_000,
      totals: { income: 62_000_000, expense: 35_000_000, flex: 7_200_000 },
    },
    changedCount: 3,
    saving: true,
    onSave: () => {},
    onResetAll: () => {},
  },
};
