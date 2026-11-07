import type { Meta, StoryObj } from '@storybook/react';
import { HomeButton } from './HomeButton';

const meta: Meta<typeof HomeButton> = {
  title: 'Shell/HomeButton',
  component: HomeButton,
  decorators: [
    (Story) => (
      <div className="flex max-w-md items-center justify-between border-b bg-white p-2">
        <span className="text-sm font-semibold">2026년 경제 목표</span>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HomeButton>;

/** 경제 목표 헤더 우측에 놓인 모습 */
export const Default: Story = {};
