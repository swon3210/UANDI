import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FeedbackTypeSelector, type FeedbackType } from './FeedbackTypeSelector';

const meta: Meta<typeof FeedbackTypeSelector> = {
  title: 'Settings/FeedbackTypeSelector',
  component: FeedbackTypeSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '의견 보내기 유형 세그먼트(버그/의견/기타). 기본값 없이 시작하고 하나만 고른다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeedbackTypeSelector>;

function Harness({ initial, invalid }: { initial: FeedbackType | null; invalid?: boolean }) {
  const [value, setValue] = useState<FeedbackType | null>(initial);
  return (
    <div className="max-w-md bg-background p-4">
      <FeedbackTypeSelector value={value} onValueChange={setValue} aria-invalid={invalid} />
    </div>
  );
}

export const 미선택: Story = { render: () => <Harness initial={null} /> };
export const 버그_선택: Story = { render: () => <Harness initial="bug" /> };
export const 미선택_오류: Story = { render: () => <Harness initial={null} invalid /> };
export const 비활성: Story = {
  render: () => (
    <div className="max-w-md bg-background p-4">
      <FeedbackTypeSelector value="idea" onValueChange={() => {}} disabled />
    </div>
  ),
};
