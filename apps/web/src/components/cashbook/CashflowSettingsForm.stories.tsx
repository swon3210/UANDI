import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { CashflowSettingsForm } from './CashflowSettingsForm';

const meta: Meta<typeof CashflowSettingsForm> = {
  title: 'Cashbook/Cashflow/SettingsForm',
  component: CashflowSettingsForm,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowSettingsForm>;

const noop = () => {};

export const Empty: Story = {
  args: { onSubmit: noop, onClose: noop },
};

export const Prefilled: Story = {
  args: {
    initial: {
      initialCash: 2500000,
      initialDate: new Date('2026-01-01T00:00:00'),
    },
    onSubmit: noop,
    onClose: noop,
  },
};
