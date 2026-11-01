import type { Meta, StoryObj } from '@storybook/react';
import { AnnualPlanPromptCard } from './AnnualPlanPromptCard';

const meta: Meta<typeof AnnualPlanPromptCard> = {
  title: 'Dashboard/AnnualPlanPromptCard',
  component: AnnualPlanPromptCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '올해 연간 플랜이 없을 때 대시보드 상단에 보이는 권유 카드. 위저드로 강제 이동하던 동작을 대체한다. 닫으면 30일 뒤 다시 보이고, 플랜이 생기면 사라진다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: {
    year: 2026,
    href: '/inner/cashbook/plan/annual/wizard?step=intro',
    onDismiss: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AnnualPlanPromptCard>;

export const Default: Story = { name: '기본' };
