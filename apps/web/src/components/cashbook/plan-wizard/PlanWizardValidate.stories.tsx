import type { Meta, StoryObj } from '@storybook/react';
import { PlanWizardValidate } from './PlanWizardValidate';

const meta: Meta<typeof PlanWizardValidate> = {
  title: 'Cashbook/PlanWizard/Validate',
  component: PlanWizardValidate,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof PlanWizardValidate>;

export const Pass: Story = {
  args: {
    validation: {
      ok: true,
      deficit: -8_000_000,
      totals: { income: 60_000_000, expense: 48_000_000, flex: 4_000_000 },
    },
  },
};

export const PassTight: Story = {
  args: {
    validation: {
      ok: true,
      deficit: 0,
      totals: { income: 50_000_000, expense: 46_000_000, flex: 4_000_000 },
    },
  },
};

export const Fail: Story = {
  args: {
    validation: {
      ok: false,
      deficit: 1_200_000,
      totals: { income: 50_000_000, expense: 47_000_000, flex: 4_200_000 },
    },
  },
};

export const FailLarge: Story = {
  args: {
    validation: {
      ok: false,
      deficit: 12_000_000,
      totals: { income: 40_000_000, expense: 46_000_000, flex: 6_000_000 },
    },
  },
};

export const Empty: Story = {
  args: {
    validation: {
      ok: true,
      deficit: 0,
      totals: { income: 0, expense: 0, flex: 0 },
    },
  },
};
