import type { Meta, StoryObj } from '@storybook/react';
import { PlanWizardIntro } from './PlanWizardIntro';

const meta: Meta<typeof PlanWizardIntro> = {
  title: 'Cashbook/PlanWizard/Intro',
  component: PlanWizardIntro,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof PlanWizardIntro>;

export const Default: Story = {
  args: {
    year: 2026,
    incomeCount: 5,
    expenseCount: 16,
    flexCount: 4,
  },
};

export const Empty: Story = {
  args: {
    year: 2026,
    incomeCount: 0,
    expenseCount: 0,
    flexCount: 0,
  },
};
