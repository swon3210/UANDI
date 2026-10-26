import type { Meta, StoryObj } from '@storybook/react-vite';
import { SavingsSummaryCard } from './SavingsSummaryCard';

const meta: Meta<typeof SavingsSummaryCard> = {
  title: 'Outer/SavingsSummaryCard',
  component: SavingsSummaryCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof SavingsSummaryCard>;

export const Default: Story = {
  args: { currentPrincipal: 3600000, maturityAmount: 12231000, activeCount: 2 },
};

/** 억 단위 큰 금액 */
export const LargeAmount: Story = {
  args: { currentPrincipal: 152000000, maturityAmount: 210450000, activeCount: 7 },
};

export const Loading: Story = {
  args: { currentPrincipal: 0, maturityAmount: 0, activeCount: 0, isLoading: true },
};
